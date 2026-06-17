import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubscriptionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'maria@email.com' })
  customer_email: string;

  @ApiProperty({ example: 'Maria Silva' })
  customer_name: string;

  @ApiPropertyOptional({ example: '868123456789012' })
  device_id?: string;

  @ApiProperty({
    enum: ['pending_device', 'active', 'past_due', 'canceled'],
  })
  status: string;

  @ApiProperty()
  current_period_end: string;

  @ApiProperty()
  is_active: boolean;
}

export class SubscriptionListResponseDto {
  @ApiProperty({ type: [SubscriptionResponseDto] })
  subscriptions: SubscriptionResponseDto[];
}
