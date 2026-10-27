import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export class DepartamentoQueryDto {
  @ApiProperty({ minLength: 2, example: 'Bolívar' })
  @IsString()
  @MinLength(2)
  departamento!: string;
}

export class SitesQueryDto extends DepartamentoQueryDto {
  @ApiPropertyOptional({ default: 100, maximum: 1000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  limit: number = 100;
}

export class HeatmapQueryDto extends DepartamentoQueryDto {
  @ApiPropertyOptional({ example: 'Cartagena' })
  @IsOptional()
  @IsString()
  municipio?: string;
}

/** En /foursquare/municipios el departamento es opcional. */
export class OptionalDepartamentoQueryDto {
  @ApiPropertyOptional({ minLength: 2 })
  @IsOptional()
  @IsString()
  @MinLength(2)
  departamento?: string;
}
