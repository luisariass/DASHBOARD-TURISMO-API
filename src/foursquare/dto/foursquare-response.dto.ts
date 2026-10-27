import { ApiProperty } from '@nestjs/swagger';

export class SiteFoursquareDto {
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
  latitude!: number | null;

  @ApiProperty({ nullable: true })
  longitude!: number | null;

  @ApiProperty({ nullable: true })
  rating!: number | null;
}

export class ReviewerDto {
  @ApiProperty({ name: '_id' })
  _id!: string;

  @ApiProperty({ nullable: true })
  user_id!: string | null;

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

export class SiteListResponseDto {
  @ApiProperty()
  total!: number;

  @ApiProperty({ type: [SiteFoursquareDto] })
  sitios!: SiteFoursquareDto[];
}

export class ReviewerListResponseDto {
  @ApiProperty()
  total!: number;

  @ApiProperty({ type: [ReviewerDto], name: 'reseñantes' })
  reseñantes!: ReviewerDto[];
}

export class TipListResponseDto {
  @ApiProperty()
  total_tips!: number;

  @ApiProperty({ type: [ExpandedTipDto] })
  tips!: ExpandedTipDto[];
}
