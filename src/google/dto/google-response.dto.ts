import { ApiProperty } from '@nestjs/swagger';

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

export class ReviewerDto {
  @ApiProperty({ name: '_id' })
  _id!: string;

  @ApiProperty({ nullable: true })
  id!: string | null;

  @ApiProperty({ nullable: true })
  user_name!: string | null;

  @ApiProperty({ nullable: true })
  municipio!: string | null;

  @ApiProperty({ nullable: true })
  departamento!: string | null;
}

export class TipDetailsDto {
  @ApiProperty()
  tip_id!: string;

  @ApiProperty({ nullable: true })
  site_id!: string | null;

  @ApiProperty({ nullable: true })
  date!: string | null;

  @ApiProperty({ nullable: true })
  reviewed_place!: string | null;

  @ApiProperty({ nullable: true })
  reviewed_category!: string | null;

  @ApiProperty({ nullable: true })
  comment!: string | null;

  @ApiProperty({ nullable: true })
  score!: number | null;
}

export class ExpandedTipDto {
  @ApiProperty({ nullable: true })
  user_name!: string | null;

  @ApiProperty({ nullable: true })
  municipio!: string | null;

  @ApiProperty({ nullable: true })
  departamento!: string | null;

  @ApiProperty({ type: TipDetailsDto })
  tip!: TipDetailsDto;
}

/* Clase para listar los sitios */
export class SiteListResponseDto {
  @ApiProperty()
  total!: number;

  @ApiProperty({ type: [SiteGoogleDto] })
  sitios!: SiteGoogleDto[];
}

/* Clase para listar los reseñantes */
export class ReviewerListResponseDto {
  @ApiProperty()
  total!: number;

  @ApiProperty({ type: [ReviewerDto], name: 'reseñantes' })
  reseñantes!: ReviewerDto[];
}

/* Clase para listar los comentarios */
export class TipListResponseDto {
  @ApiProperty()
  total_tips!: number;

  @ApiProperty({ type: [ExpandedTipDto] })
  tips!: ExpandedTipDto[];
}