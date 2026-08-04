import { ApiProperty } from '@nestjs/swagger';

/**
 * Los nombres de estas claves son el contrato con el frontend y no se pueden
 * "mejorar": están en español, con ñ, y con `_id` sin normalizar. Cambiar
 * cualquiera rompe el dashboard en silencio, porque axios no valida forma.
 *
 * Los tipos declarados aquí son también lo que filtra la respuesta: en FastAPI
 * el response_model descartaba cualquier campo no declarado, así que un
 * documento de Mongo con 30 campos salía con los 8 del modelo. Los mappers
 * replican ese filtrado.
 */

export class NameListResponseDto {
  @ApiProperty()
  total!: number;

  @ApiProperty({ type: [String] })
  nombres!: string[];
}

export class HeatmapPointDto {
  @ApiProperty()
  latitude!: number | null;

  @ApiProperty()
  longitude!: number | null;
}

export class HeatmapResponseDto {
  @ApiProperty()
  total!: number;

  @ApiProperty({ type: [HeatmapPointDto] })
  points!: HeatmapPointDto[];
}
