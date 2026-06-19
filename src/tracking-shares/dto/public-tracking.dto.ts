import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class PublicTrackingQueryDto {
  @ApiPropertyOptional({ description: 'ISO — retorna leituras após este instante (polling ao vivo)' })
  @IsOptional()
  @IsString()
  since?: string;

  @ApiPropertyOptional({ default: 200 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;
}

export class PublicTrackingLocationDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  latitude: number;

  @ApiProperty()
  longitude: number;

  @ApiPropertyOptional()
  speed_knots?: number;

  @ApiPropertyOptional()
  battery_percent?: number;

  @ApiProperty()
  recorded_at: string;

  @ApiProperty()
  received_at: string;
}

export class PublicTrackingResponseDto {
  @ApiProperty()
  recipient_name: string;

  @ApiProperty()
  device_label: string;

  @ApiProperty()
  device_icon: string;

  @ApiProperty({ nullable: true })
  expires_at: string | null;

  @ApiProperty({ type: [PublicTrackingLocationDto] })
  locations: PublicTrackingLocationDto[];
}
