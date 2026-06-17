import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthUser } from '../auth/auth-user.interface';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { VouchersService } from '../vouchers/vouchers.service';
import { CheckoutDto } from './dto/checkout.dto';
import { OrderItem } from './entities/order-item.entity';
import { Order } from './entities/order.entity';
import { formatBrl, ProductsService } from './products.service';

@Injectable()
export class StoreService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemsRepository: Repository<OrderItem>,
    private readonly productsService: ProductsService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly vouchersService: VouchersService,
  ) {}

  async listProducts() {
    const products = await this.productsService.findAllActive();
    return products.map((product) => ({
      slug: product.slug,
      name: product.name,
      description: product.description,
      type: product.type,
      price_cents: product.price_cents,
      price_label: formatBrl(product.price_cents),
      subscription_days: product.subscription_days,
    }));
  }

  async buildCartTotals(items: CheckoutDto['items']) {
    if (!items?.length) {
      throw new BadRequestException('Informe ao menos um item no pedido');
    }

    const orderItems: OrderItem[] = [];
    let subtotalCents = 0;
    let hardwareUnits = 0;
    let subscriptionDaysTotal = 0;

    for (const item of items) {
      const product = await this.productsService.findBySlug(item.product_slug);
      if (!product) {
        throw new NotFoundException(`Produto ${item.product_slug} não encontrado`);
      }

      subtotalCents += product.price_cents * item.quantity;

      if (product.type === 'hardware') {
        hardwareUnits += item.quantity;
      }

      if (product.type === 'subscription' && product.subscription_days) {
        subscriptionDaysTotal += product.subscription_days * item.quantity;
      }

      orderItems.push(
        this.orderItemsRepository.create({
          product_id: product.id,
          product_slug: product.slug,
          product_name: product.name,
          quantity: item.quantity,
          unit_price_cents: product.price_cents,
        }),
      );
    }

    if (hardwareUnits === 0) {
      throw new BadRequestException(
        'Adicione ao menos um kit de rastreador ao pedido',
      );
    }

    return {
      orderItems,
      subtotalCents,
      hardwareUnits,
      subscriptionDaysTotal,
    };
  }

  async previewVoucher(
    items: CheckoutDto['items'],
    voucherCode?: string,
  ) {
    const cart = await this.buildCartTotals(items);

    if (!voucherCode?.trim()) {
      return {
        valid: false,
        subtotal_cents: cart.subtotalCents,
        discount_cents: 0,
        total_cents: cart.subtotalCents,
        subtotal_label: formatBrl(cart.subtotalCents),
        discount_label: formatBrl(0),
        total_label: formatBrl(cart.subtotalCents),
        voucher_code: null,
        message: 'Informe um código de voucher',
      };
    }

    const quote = await this.vouchersService.quote(
      voucherCode,
      cart.subtotalCents,
    );

    return {
      valid: true,
      subtotal_cents: quote.subtotal_cents,
      discount_cents: quote.discount_cents,
      total_cents: quote.total_cents,
      subtotal_label: quote.subtotal_label,
      discount_label: quote.discount_label,
      total_label: quote.total_label,
      voucher_code: quote.voucher.code,
      message: `Desconto de ${quote.discount_label} aplicado`,
    };
  }

  async checkout(user: AuthUser, dto: CheckoutDto) {
    const cart = await this.buildCartTotals(dto.items);

    let discountCents = 0;
    let voucherCode: string | null = null;
    let voucherToRedeem = null;

    if (dto.voucher_code?.trim()) {
      const quote = await this.vouchersService.quote(
        dto.voucher_code,
        cart.subtotalCents,
      );
      discountCents = quote.discount_cents;
      voucherCode = quote.voucher.code;
      voucherToRedeem = quote.voucher;
    }

    const totalCents = Math.max(0, cart.subtotalCents - discountCents);

    const daysPerSlot =
      cart.subscriptionDaysTotal > 0
        ? Math.max(30, Math.round(cart.subscriptionDaysTotal / cart.hardwareUnits))
        : 30;

    const order = await this.ordersRepository.save(
      this.ordersRepository.create({
        user_id: user.id,
        customer_name: user.name,
        customer_email: user.email,
        status: 'paid',
        subtotal_cents: cart.subtotalCents,
        discount_cents: discountCents,
        total_cents: totalCents,
        voucher_code: voucherCode,
        items: cart.orderItems,
      }),
    );

    if (voucherToRedeem) {
      await this.vouchersService.redeem(voucherToRedeem);
    }

    const subscriptions = await this.subscriptionsService.createPendingSlots({
      user,
      orderId: order.id,
      quantity: cart.hardwareUnits,
      daysPerSlot,
      labelPrefix: 'Rastreador',
    });

    return {
      order_id: order.id,
      subtotal_cents: cart.subtotalCents,
      subtotal_label: formatBrl(cart.subtotalCents),
      discount_cents: discountCents,
      discount_label: formatBrl(discountCents),
      total_cents: totalCents,
      total_label: formatBrl(totalCents),
      voucher_code: voucherCode,
      devices_created: subscriptions.length,
      subscription_ids: subscriptions.map((item) => item.id),
      message:
        discountCents > 0
          ? `Pedido confirmado com desconto de ${formatBrl(discountCents)}! Ative cada IMEI na sua conta quando receber os equipamentos.`
          : 'Pedido confirmado! Quando receber cada equipamento, ative o IMEI na sua conta.',
    };
  }

  async listOrdersForUser(userId: string) {
    const orders = await this.ordersRepository.find({
      where: { user_id: userId },
      relations: ['items'],
      order: { created_at: 'DESC' },
    });

    return orders.map((order) => ({
      id: order.id,
      status: order.status,
      subtotal_cents: order.subtotal_cents || order.total_cents,
      subtotal_label: formatBrl(order.subtotal_cents || order.total_cents),
      discount_cents: order.discount_cents,
      discount_label:
        order.discount_cents > 0 ? formatBrl(order.discount_cents) : null,
      voucher_code: order.voucher_code,
      total_cents: order.total_cents,
      total_label: formatBrl(order.total_cents),
      created_at: order.created_at.toISOString(),
      items: order.items.map((item) => ({
        product_slug: item.product_slug,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price_cents: item.unit_price_cents,
        line_total_cents: item.unit_price_cents * item.quantity,
        line_total_label: formatBrl(item.unit_price_cents * item.quantity),
      })),
    }));
  }
}
