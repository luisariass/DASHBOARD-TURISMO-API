import {
  Global,
  Inject,
  Logger,
  Module,
  OnApplicationShutdown,
} from '@nestjs/common';
import { setServers } from 'node:dns';
import { Db, MongoClient } from 'mongodb';
import { APP_CONFIG, AppConfig } from '../config/configuration';
import { DB_FOURSQUARE, DB_GOOGLE, MONGO_CLIENT } from './database.constants';

/**
 * Módulo de conexión a MongoDB Atlas.
 * Utiliza un único MongoClient compartido con un pool de conexiones para ambas bases de datos.
 */
@Global()
@Module({
  providers: [
    {
      provide: MONGO_CLIENT,
      inject: [APP_CONFIG],
      useFactory: async (config: AppConfig): Promise<MongoClient> => {
        // Con `mongodb+srv://` el driver resuelve un registro SRV antes de
        // conectar. Node descubre los servidores DNS por su cuenta (c-ares) y en
        // algunas máquinas Windows se queda con un loopback que no responde, con
        // lo que el arranque muere en `querySrv ECONNREFUSED`. DNS_SERVERS es el
        // escape para ese caso concreto; sin ella se usa el DNS del sistema.
        if (config.dnsServers.length > 0) {
          setServers(config.dnsServers);
          new Logger('Database').log(
            `DNS forzado a ${config.dnsServers.join(', ')}`,
          );
        }
        const client = new MongoClient(config.mongodbUri);
        await client.connect();
        new Logger('Database').log('Conectado a MongoDB');
        return client;
      },
    },
    {
      provide: DB_FOURSQUARE,
      inject: [MONGO_CLIENT, APP_CONFIG],
      useFactory: (client: MongoClient, config: AppConfig): Db =>
        client.db(config.mongodbDatabaseFoursquare),
    },
    {
      provide: DB_GOOGLE,
      inject: [MONGO_CLIENT, APP_CONFIG],
      useFactory: (client: MongoClient, config: AppConfig): Db =>
        client.db(config.mongodbDatabaseGoogle),
    },
  ],
  exports: [MONGO_CLIENT, DB_FOURSQUARE, DB_GOOGLE],
})
export class DatabaseModule implements OnApplicationShutdown {
  private readonly logger = new Logger(DatabaseModule.name);

  constructor(@Inject(MONGO_CLIENT) private readonly client: MongoClient) {}

  async onApplicationShutdown(): Promise<void> {
    await this.client.close();
    this.logger.log('Desconectado de MongoDB');
  }
}
