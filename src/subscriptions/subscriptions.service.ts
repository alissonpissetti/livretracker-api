import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthUser } from '../auth/auth-user.interface';
import { DevicesService } from '../devices/devices.service';
import { DEFAULT_DEVICE_ICON, DeviceIcon } from './device-icon';
import { Subscription } from './entities/subscription.entity';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionsRepository: Repository<Subscription>,
    private readonly devicesService: DevicesService,
  ) {}

  isActive(subscription: Subscription): boolean {
    if (subscription.status === 'canceled') {
      return false;
    }

    return subscription.current_period_end.getTime() > Date.now();
  }

  async findByUserId(userId: string): Promise<Subscription[]> {
    return this.subscriptionsRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
  }

  async findByIdForUser(
    subscriptionId: string,
    userId: string,
  ): Promise<Subscription> {
    const subscription = await this.subscriptionsRepository.findOne({
      where: { id: subscriptionId, user_id: userId },
    });

    if (!subscription) {
      throw new NotFoundException('Equipamento/assinatura não encontrado');
    }

    return subscription;
  }

  async findByDeviceId(deviceId: string): Promise<Subscription | null> {
    return this.subscriptionsRepository.findOne({
      where: { device_id: deviceId },
    });
  }

  async assertDeviceCanTrack(deviceId: string): Promise<void> {
    const subscription = await this.findByDeviceId(deviceId);
    if (!subscription) {
      return;
    }

    this.refreshStatus(subscription);

    if (!this.isActive(subscription)) {
      throw new ForbiddenException(
        `Assinatura inativa para o equipamento ${deviceId}`,
      );
    }
  }

  async createPendingSlots(input: {
    user: AuthUser;
    orderId: string;
    quantity: number;
    daysPerSlot: number;
    labelPrefix?: string;
  }): Promise<Subscription[]> {
    const slots: Subscription[] = [];

    for (let index = 0; index < input.quantity; index++) {
      const slot = this.subscriptionsRepository.create({
        user_id: input.user.id,
        customer_email: input.user.email,
        customer_name: input.user.name,
        status: 'pending_device',
        current_period_end: this.addDays(new Date(), input.daysPerSlot),
        order_id: input.orderId,
        label: input.labelPrefix
          ? `${input.labelPrefix} #${index + 1}`
          : `Equipamento #${index + 1}`,
        icon: DEFAULT_DEVICE_ICON,
      });
      slots.push(await this.subscriptionsRepository.save(slot));
    }

    return slots;
  }

  async activateDevice(
    subscriptionId: string,
    deviceId: string,
    userId: string,
  ): Promise<Subscription> {
    const subscription = await this.findByIdForUser(subscriptionId, userId);

    if (subscription.device_id) {
      throw new BadRequestException('Este slot já possui um IMEI vinculado');
    }

    const normalizedDeviceId = deviceId.trim();
    const existing = await this.findByDeviceId(normalizedDeviceId);
    if (existing && existing.id !== subscription.id) {
      throw new BadRequestException(
        'Este IMEI já está vinculado a outra conta ou equipamento',
      );
    }

    await this.devicesService.ensureExists(normalizedDeviceId);

    subscription.device_id = normalizedDeviceId;
    subscription.status = this.isActive(subscription) ? 'active' : 'past_due';

    return this.subscriptionsRepository.save(subscription);
  }

  async updateDeviceProfile(
    subscriptionId: string,
    userId: string,
    input: { label?: string; icon?: DeviceIcon },
  ): Promise<Subscription> {
    const subscription = await this.findByIdForUser(subscriptionId, userId);

    if (input.label !== undefined) {
      subscription.label = input.label.trim();
    }

    if (input.icon !== undefined) {
      subscription.icon = input.icon;
    }

    return this.subscriptionsRepository.save(subscription);
  }

  async renew(subscriptionId: string, userId: string, days = 30): Promise<Subscription> {
    const subscription = await this.findByIdForUser(subscriptionId, userId);

    const base =
      subscription.current_period_end.getTime() > Date.now()
        ? subscription.current_period_end
        : new Date();

    subscription.current_period_end = this.addDays(base, days);
    subscription.status = subscription.device_id ? 'active' : 'pending_device';

    return this.subscriptionsRepository.save(subscription);
  }

  private refreshStatus(subscription: Subscription): void {
    if (subscription.status === 'canceled') {
      return;
    }

    if (!this.isActive(subscription)) {
      subscription.status = 'past_due';
    } else if (subscription.device_id) {
      subscription.status = 'active';
    }
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
}
