import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class CheckoutItemDto {
  @ApiProperty({ example: 'kit-tsim7080g' })
  @IsString()
  @IsNotEmpty()
  product_slug: string;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CheckoutDto {
  @ApiProperty({ type: [CheckoutItemDto] })
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  @ArrayMinSize(1)
  items: CheckoutItemDto[];

  @ApiPropertyOptional({ example: 'LIVE10' })
  @IsOptional()
  @IsString()
  voucher_code?: string;
}
