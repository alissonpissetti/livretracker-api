import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class UpdateDeviceRegistryDto {
  @ApiPropertyOptional({
    description: 'Número de telefone do chip SIM (MSISDN) para receber SMS de comando.',
    example: '+5511999999999',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  sim_msisdn?: string;

  @ApiPropertyOptional({ example: '868123456789012' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  imei?: string;

  @ApiPropertyOptional({ example: '89550123456789012345' })
  @IsOptional()
  @IsString()
  @MaxLength(24)
  iccid?: string;

  @ApiPropertyOptional({ example: '724051234567890' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  imsi?: string;

  @ApiPropertyOptional({ example: 'Vivo' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  operator?: string;

  @ApiPropertyOptional({
    description: 'Carga da bateria no momento da leitura (0–100).',
    example: 87,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  battery_percent?: number;

  @ApiPropertyOptional({
    description: 'USB-C conectado na leitura de energia.',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  usb_connected?: boolean;

  @ApiPropertyOptional({
    description: 'Bateria em carga na leitura de energia.',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  battery_charging?: boolean;
}

export class DeviceRegistryResponseDto {
  @ApiProperty()
  device_id: string;

  @ApiPropertyOptional({ nullable: true })
  sim_msisdn: string | null;

  @ApiProperty()
  updated_at: string;
}
