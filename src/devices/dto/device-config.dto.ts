import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DeviceConfigDto {
  @ApiProperty({ enum: ['normal', 'emergency'] })
  mode: 'normal' | 'emergency';

  @ApiPropertyOptional({ nullable: true })
  emergency_until: string | null;

  @ApiProperty({ example: 120 })
  report_interval_sec: number;

  @ApiProperty({ example: 60 })
  config_poll_interval_sec: number;

  @ApiProperty({ example: 40 })
  stop_distance_m: number;

  @ApiProperty({ example: 3 })
  stop_samples_required: number;

  @ApiProperty({
    description:
      'PIN de 6 dígitos para validar SMS de comando recebidos pelo equipamento.',
    example: '482913',
  })
  sms_command_pin: string;
}
