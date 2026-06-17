import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountDeviceDto } from './account-response.dto';

export class AccountDeviceLocationDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  latitude: number;

  @ApiProperty()
  longitude: number;

  @ApiPropertyOptional()
  speed_knots?: number;

  @ApiPropertyOptional()
  accuracy_m?: number;

  @ApiPropertyOptional({ enum: ['lbs', 'gps'] })
  location_source?: string;

  @ApiPropertyOptional()
  battery_percent?: number;

  @ApiProperty()
  recorded_at: string;

  @ApiProperty()
  received_at: string;
}

export class AccountDeviceLocationsResponseDto {
  @ApiProperty({ type: AccountDeviceDto })
  device: AccountDeviceDto;

  @ApiProperty({ type: [AccountDeviceLocationDto] })
  locations: AccountDeviceLocationDto[];
}
