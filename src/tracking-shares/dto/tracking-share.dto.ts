import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateTrackingShareDto {
  @ApiProperty({ example: 'Vanessa', description: 'Nome de quem vai acompanhar' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  recipient_name: string;

  @ApiPropertyOptional({
    example: 12,
    description: 'Validade do link em horas (padrão 12). Omita para sem expiração.',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(168)
  expires_in_hours?: number;
}

export class TrackingShareDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  token: string;

  @ApiProperty()
  recipient_name: string;

  @ApiProperty({ nullable: true })
  expires_at: string | null;

  @ApiProperty()
  created_at: string;

  @ApiProperty()
  share_url: string;

  @ApiProperty()
  is_active: boolean;
}

export class TrackingShareListResponseDto {
  @ApiProperty({ type: [TrackingShareDto] })
  shares: TrackingShareDto[];
}
