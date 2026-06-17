import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class ActivateDeviceDto {
  @ApiProperty({ example: '868123456789012' })
  @IsString()
  @IsNotEmpty()
  @Length(14, 20)
  device_id: string;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';

export class RenewSubscriptionDto {
  @ApiPropertyOptional({ example: 30, description: 'Dias adicionais de assinatura' })
  @IsOptional()
  @IsInt()
  @Min(1)
  days?: number;
}
