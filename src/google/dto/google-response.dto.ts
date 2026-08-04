import { ApiProperty } from '@nestjs/swagger';

/**
 * Equivale a SiteGoogle de app/models/schemas.py. La diferencia con el sitio de
 * Foursquare es el campo de puntuación: aquí es `puntuacion` y no `rating`, y no
 * hay coordenadas declaradas.
 */
export class SiteGoogleDto {
  @ApiProperty({ name: '_id' })
  _id!: string;

  @ApiProperty({ nullable: true })
  nombre!: string | null;

  @ApiProperty({ nullable: true })
  municipio!: string | null;

  @ApiProperty({ nullable: true })
  departamento!: string | null;

  @ApiProperty({ nullable: true })
  categoria!: string | null;

  @ApiProperty({ nullable: true })
  puntuacion!: number | null;
}

/**
 * La clave del listado es `sitios`, igual que en Foursquare: el frontend usa el
 * mismo tipo SitesResponse para los dos proveedores.
 */
export class GoogleListResponseDto {
  @ApiProperty()
  total!: number;

  @ApiProperty({ type: [SiteGoogleDto] })
  sitios!: SiteGoogleDto[];
}
