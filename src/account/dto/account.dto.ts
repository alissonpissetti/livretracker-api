import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString, Length, Matches, ValidateIf } from 'class-validator';
import { DEVICE_ICONS } from '../../subscriptions/device-icon';

const PHONE_PATTERN = /^\+?[1-9]\d{9,14}$/;

export class UpdateAccountProfileDto {
  @ApiProperty({ example: 'Maria Silva', required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Length(2, 120)
  name?: string;

  @ApiProperty({
    example: '+5511987654321',
    required: false,
    nullable: true,
    description: 'Celular para alertas e login por SMS. Envie null para remover.',
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @IsString()
  @Matches(PHONE_PATTERN, {
    message: 'Telefone inválido. Use DDD + número, ex: (11) 98765-4321',
  })
  phone?: string | null;
}

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

export class UpdateDeviceAlertsDto {
  @ApiProperty({
    example: true,
    required: false,
    description: 'Aviso por SMS quando a bateria ficar abaixo de 20%.',
  })
  @IsOptional()
  @IsBoolean()
  alert_battery_low_enabled?: boolean;

  @ApiProperty({
    example: true,
    required: false,
    description: 'Aviso por SMS quando a bateria atingir 100%.',
  })
  @IsOptional()
  @IsBoolean()
  alert_battery_full_enabled?: boolean;
}

export class UpdateDeviceChipDto {
  @ApiProperty({
    example: '+5511987654321',
    description:
      'Número do chip (MSISDN) para receber SMS de comando. Use o número informado pela Vivo se o equipamento ainda não reportou.',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(PHONE_PATTERN, {
    message: 'Número do chip inválido. Use DDD + número, ex: (11) 98765-4321',
  })
  sim_msisdn: string;
}
