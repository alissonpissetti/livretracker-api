import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DeviceResponseDto {
  @ApiProperty({ example: 'cdf6b5de-08d5-4e24-854e-04dcf7d405f5' })
  id: string;

  @ApiProperty({ example: '868123456789012' })
  device_id: string;

  @ApiProperty({ example: false })
  blocked: boolean;

  @ApiPropertyOptional({ example: '2026-06-15T20:00:00.000Z' })
  blocked_at?: string;

  @ApiPropertyOptional({ example: 'Equipamento reportado como roubado' })
  blocked_reason?: string;

  @ApiPropertyOptional({ example: -23.5505199 })
  last_latitude?: number;

  @ApiPropertyOptional({ example: -46.6333094 })
  last_longitude?: number;

  @ApiPropertyOptional({ example: 'lbs', enum: ['lbs', 'gps'] })
  last_location_source?: string;

  @ApiProperty({ example: '2026-06-15T18:00:00.000Z' })
  first_seen_at: string;

  @ApiProperty({ example: '2026-06-15T22:30:00.000Z' })
  last_seen_at: string;
}

export class DeviceListResponseDto {
  @ApiProperty({ type: [DeviceResponseDto] })
  devices: DeviceResponseDto[];
}
