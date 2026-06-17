import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DevicesService } from '../devices/devices.service';
import { Device } from '../devices/entities/device.entity';
import { formatBrl } from '../store/products.service';
import { Order } from '../store/entities/order.entity';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import {
  CreateVoucherDto,
  UpdateVoucherDto,
} from '../vouchers/dto/voucher.dto';
import { VouchersService } from '../vouchers/vouchers.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly usersService: UsersService,
    private readonly devicesService: DevicesService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly vouchersService: VouchersService,
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @InjectRepository(Subscription)
    private readonly subscriptionsRepository: Repository<Subscription>,
    @InjectRepository(Device)
    private readonly devicesRepository: Repository<Device>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async getOverview() {
    const [users, subscriptions, devices, orders, vouchers] = await Promise.all([
      this.usersRepository.count(),
      this.subscriptionsRepository.count(),
      this.devicesRepository.count(),
      this.ordersRepository.count(),
      this.vouchersService.findAll(),
    ]);

    const allSubscriptions = await this.subscriptionsRepository.find();
    const activeSubscriptions = allSubscriptions.filter((item) =>
      this.subscriptionsService.isActive(item),
    ).length;
    const pendingActivation = allSubscriptions.filter(
      (item) => !item.device_id,
    ).length;
    const blockedDevices = await this.devicesRepository.count({
      where: { blocked: true },
    });

    return {
      users_total: users,
      subscriptions_total: subscriptions,
      subscriptions_active: activeSubscriptions,
      subscriptions_pending_activation: pendingActivation,
      devices_tracked: devices,
      devices_blocked: blockedDevices,
      orders_total: orders,
      vouchers_total: vouchers.length,
      vouchers_active: vouchers.filter((item) => item.active).length,
    };
  }

  async listUsers() {
    const users = await this.usersService.findAll();
    const subscriptions = await this.subscriptionsRepository.find();

    return users
      .filter((user) => user.role === 'customer')
      .map((user) => {
        const userSubs = subscriptions.filter((item) => item.user_id === user.id);
        const activeDevices = userSubs.filter(
          (item) =>
            item.device_id && this.subscriptionsService.isActive(item),
        ).length;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          created_at: user.created_at.toISOString(),
          devices_total: userSubs.length,
          devices_active: activeDevices,
          devices_pending: userSubs.filter((item) => !item.device_id).length,
        };
      });
  }

  async getUserDetail(userId: string) {
    const user = await this.usersService.findById(userId);
    const subscriptions = await this.subscriptionsRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });

    const devices = await Promise.all(
      subscriptions.map(async (subscription) => {
        const telemetry = subscription.device_id
          ? await this.devicesRepository.findOne({
              where: { device_id: subscription.device_id },
            })
          : null;

        return {
          subscription_id: subscription.id,
          label: subscription.label,
          device_id: subscription.device_id,
          status: subscription.status,
          is_active: this.subscriptionsService.isActive(subscription),
          awaiting_activation: !subscription.device_id,
          current_period_end: subscription.current_period_end.toISOString(),
          blocked: telemetry?.blocked ?? false,
          blocked_reason: telemetry?.blocked_reason,
          last_latitude: telemetry?.last_latitude,
          last_longitude: telemetry?.last_longitude,
          last_seen_at: telemetry?.last_seen_at?.toISOString(),
        };
      }),
    );

    const orders = await this.ordersRepository.find({
      where: { user_id: userId },
      relations: ['items'],
      order: { created_at: 'DESC' },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      created_at: user.created_at.toISOString(),
      devices,
      orders: orders.map((order) => ({
        id: order.id,
        total_label: formatBrl(order.total_cents),
        voucher_code: order.voucher_code,
        discount_label:
          order.discount_cents > 0 ? formatBrl(order.discount_cents) : null,
        created_at: order.created_at.toISOString(),
        items: order.items.map((item) => ({
          product_name: item.product_name,
          quantity: item.quantity,
        })),
      })),
    };
  }

  async listManagedDevices() {
    const subscriptions = await this.subscriptionsRepository.find({
      order: { updated_at: 'DESC' },
    });
    const users = await this.usersRepository.find();
    const userById = new Map(users.map((user) => [user.id, user]));

    const rows = await Promise.all(
      subscriptions.map(async (subscription) => {
        const owner = userById.get(subscription.user_id);
        const telemetry = subscription.device_id
          ? await this.devicesRepository.findOne({
              where: { device_id: subscription.device_id },
            })
          : null;

        return {
          subscription_id: subscription.id,
          label: subscription.label,
          device_id: subscription.device_id,
          status: subscription.status,
          is_active: this.subscriptionsService.isActive(subscription),
          awaiting_activation: !subscription.device_id,
          current_period_end: subscription.current_period_end.toISOString(),
          owner_user_id: owner?.id,
          owner_name: owner?.name,
          owner_email: owner?.email,
          blocked: telemetry?.blocked ?? false,
          blocked_reason: telemetry?.blocked_reason,
          last_latitude: telemetry?.last_latitude,
          last_longitude: telemetry?.last_longitude,
          last_location_source: telemetry?.last_location_source,
          last_seen_at: telemetry?.last_seen_at?.toISOString(),
        };
      }),
    );

    return rows;
  }

  async listOrders() {
    const orders = await this.ordersRepository.find({
      relations: ['items'],
      order: { created_at: 'DESC' },
    });

    const users = await this.usersRepository.find();
    const userById = new Map(users.map((user) => [user.id, user]));

    return orders.map((order) => ({
      id: order.id,
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      owner_name: userById.get(order.user_id)?.name ?? order.customer_name,
      subtotal_label: formatBrl(order.subtotal_cents || order.total_cents),
      discount_label:
        order.discount_cents > 0 ? formatBrl(order.discount_cents) : null,
      voucher_code: order.voucher_code,
      total_label: formatBrl(order.total_cents),
      created_at: order.created_at.toISOString(),
      items: order.items.map((item) => ({
        product_name: item.product_name,
        quantity: item.quantity,
        line_total_label: formatBrl(item.unit_price_cents * item.quantity),
      })),
    }));
  }

  listVouchers() {
    return this.vouchersService
      .findAll()
      .then((items) => items.map((item) => this.vouchersService.formatVoucher(item)));
  }

  async createVoucher(dto: CreateVoucherDto) {
    const voucher = await this.vouchersService.create(dto);
    return this.vouchersService.formatVoucher(voucher);
  }

  async updateVoucher(voucherId: string, dto: UpdateVoucherDto) {
    if (dto.active === undefined) {
      const voucher = await this.vouchersService.findById(voucherId);
      return this.vouchersService.formatVoucher(voucher);
    }

    const voucher = await this.vouchersService.setActive(voucherId, dto.active);
    return this.vouchersService.formatVoucher(voucher);
  }

  blockDevice(deviceId: string, reason?: string) {
    return this.devicesService.block(deviceId, { reason });
  }

  unblockDevice(deviceId: string) {
    return this.devicesService.unblock(deviceId);
  }
}
