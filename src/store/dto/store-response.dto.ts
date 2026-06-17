import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductResponseDto {
  @ApiProperty({ example: 'kit-tsim7080g' })
  slug: string;

  @ApiProperty({ example: 'Kit Rastreador T-SIM7080G' })
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ enum: ['hardware', 'subscription'] })
  type: string;

  @ApiProperty({ example: 44900, description: 'Preço em centavos' })
  price_cents: number;

  @ApiProperty({ example: 'R$ 449,00' })
  price_label: string;

  @ApiPropertyOptional({ example: 30 })
  subscription_days?: number;
}

export class CheckoutResponseDto {
  @ApiProperty()
  order_id: string;

  @ApiProperty()
  subtotal_cents: number;

  @ApiProperty()
  subtotal_label: string;

  @ApiProperty()
  discount_cents: number;

  @ApiProperty()
  discount_label: string;

  @ApiProperty()
  total_cents: number;

  @ApiProperty()
  total_label: string;

  @ApiPropertyOptional({ nullable: true })
  voucher_code: string | null;

  @ApiProperty()
  devices_created: number;

  @ApiProperty({ type: [String] })
  subscription_ids: string[];

  @ApiProperty()
  message: string;
}
