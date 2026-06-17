import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';
import { DEVICE_ICONS } from '../../subscriptions/device-icon';

export class ActivateDeviceDto {
  @ApiProperty({ example: '868123456789012' })
  @IsString()
  @IsNotEmpty()
  @Length(14, 20)
  device_id: string;
}

export class RenewSubscriptionDto {
  @ApiProperty({ example: 30, required: false })
  days?: number;
}

export class UpdateDeviceDto {
  @ApiProperty({ example: 'Carro da família', required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Length(1, 120)
  label?: string;

  @ApiProperty({
    example: 'car',
    enum: DEVICE_ICONS,
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsIn([...DEVICE_ICONS])
  icon?: string;
}
