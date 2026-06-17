import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export class LatestLocationsQueryDto {
  @ApiPropertyOptional({
    description: 'Quantidade máxima de posições retornadas.',
    default: 20,
    minimum: 1,
    maximum: 500,
    example: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Filtra posições com received_at maior ou igual a este instante (ISO 8601).',
    example: '2026-06-10T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({
    description: 'Filtra posições com received_at menor ou igual a este instante (ISO 8601).',
    example: '2026-06-10T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  to?: string;
}
