import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../auth/auth-user.interface';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { VoucherPreviewDto } from '../vouchers/dto/voucher.dto';
import { CheckoutDto } from './dto/checkout.dto';
import {
  CheckoutResponseDto,
  ProductResponseDto,
} from './dto/store-response.dto';
import { StoreService } from './store.service';

@ApiTags('store')
@Controller('v1/store')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Get('products')
  @ApiOperation({ summary: 'Listar produtos e planos' })
  @ApiOkResponse({ type: ProductResponseDto, isArray: true })
  async products() {
    return this.storeService.listProducts();
  }

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Finalizar compra',
    description:
      'Requer conta logada. Cada kit gera um slot de equipamento para ativar o IMEI depois.',
  })
  @ApiCreatedResponse({ type: CheckoutResponseDto })
  async checkout(@CurrentUser() user: AuthUser, @Body() dto: CheckoutDto) {
    return this.storeService.checkout(user, dto);
  }

  @Post('voucher/preview')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Simular desconto de voucher',
    description: 'Valida o código sem consumir uso. Requer conta logada.',
  })
  async voucherPreview(@Body() dto: VoucherPreviewDto) {
    return this.storeService.previewVoucher(dto.items, dto.voucher_code);
  }
}
