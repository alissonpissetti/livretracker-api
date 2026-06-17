import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class BlockDeviceDto {
  @ApiPropertyOptional({
    description: 'Motivo do bloqueio (ex.: inadimplência, roubo, manutenção).',
    example: 'Equipamento reportado como roubado',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}
