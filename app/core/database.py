from motor.motor_asyncio import AsyncIOMotorClient
from .config import get_settings
import certifi

settings = get_settings()

class Database:
    client: AsyncIOMotorClient = None
    db_foursquare = None
    db_google = None

    def connect(self):
        self.client = AsyncIOMotorClient(settings.MONGODB_URI, tlsCAFile=certifi.where())
        self.db_foursquare = self.client[settings.MONGODB_DATABASE_FOURSQUARE]
        self.db_google = self.client[settings.MONGODB_DATABASE_GOOGLE]

    def close(self):
        if self.client:
            self.client.close()

db = Database()

# Dependencias para inyectar en los endpoints
async def get_db_foursquare():
    return db.db_foursquare

async def get_db_google():
    return db.db_google