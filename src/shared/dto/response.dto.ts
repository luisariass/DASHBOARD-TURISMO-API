import { ApiProperty } from '@nestjs/swagger';

/**
 * Los nombres de estas claves forman el contrato con el frontend
 * (en español y con `_id` preservado).
 */
export class NameListResponseDto {
  @ApiProperty()
  total!: number;

  @ApiProperty({ type: [String] })
  nombres!: string[];
}

export class HeatmapPointDto {
  @ApiProperty({ nullable: true })
  _id?: string;

  @ApiProperty({ nullable: true })
  nombre?: string | null;

  @ApiProperty({ nullable: true })
  categoria?: string | null;

  @ApiProperty({ nullable: true })
  puntuacion?: number | null;

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
