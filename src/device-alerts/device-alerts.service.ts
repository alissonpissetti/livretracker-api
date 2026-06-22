import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SmsService } from '../auth/sms.service';
import { Device } from '../devices/entities/device.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';

const BATTERY_LOW_THRESHOLD = 20;
const BATTERY_LOW_RESET = 25;
const BATTERY_FULL_THRESHOLD = 98;
const BATTERY_FULL_RESET = 95;

@Injectable()
export class DeviceAlertsService {
  private readonly logger = new Logger(DeviceAlertsService.name);

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionsRepository: Repository<Subscription>,
    private readonly smsService: SmsService,
  ) {}

  async processBatteryReading(
    device: Device,
    batteryPercent: number | undefined,
  ): Promise<void> {
    if (
      batteryPercent == null ||
      !Number.isFinite(batteryPercent) ||
      batteryPercent < 0 ||
      batteryPercent > 100
    ) {
      return;
    }

    const rounded = Math.round(batteryPercent);
    device.last_battery_percent = rounded;

    const subscription = await this.subscriptionsRepository.findOne({
      where: { device_id: device.device_id },
      relations: ['user'],
    });

    if (!subscription?.user) {
      return;
    }

    const label = subscription.label?.trim() || 'Rastreador';
    const phone = subscription.user.phone;

    if (rounded >= BATTERY_LOW_RESET) {
      device.battery_low_alert_active = false;
    }

    if (rounded <= BATTERY_FULL_RESET) {
      device.battery_full_alert_active = false;
    }

    if (
      subscription.alert_battery_low_enabled &&
      phone &&
      rounded <= BATTERY_LOW_THRESHOLD &&
      !device.battery_low_alert_active
    ) {
      const sent = await this.sendBatteryAlert(
        phone,
        `O seu dispositivo '${label}' está com a carga de bateria abaixo de 20%.`,
      );
      if (sent) {
        device.battery_low_alert_active = true;
        this.logger.log(
          `Alerta bateria baixa enviado para ${device.device_id} (${rounded}%)`,
        );
      }
    }

    if (
      subscription.alert_battery_full_enabled &&
      phone &&
      rounded >= BATTERY_FULL_THRESHOLD &&
      !device.battery_full_alert_active
    ) {
      const sent = await this.sendBatteryAlert(
        phone,
        `O seu dispositivo '${label}' está com a carga de bateria em 100%.`,
      );
      if (sent) {
        device.battery_full_alert_active = true;
        this.logger.log(
          `Alerta bateria cheia enviado para ${device.device_id} (${rounded}%)`,
        );
      }
    }
  }

  private async sendBatteryAlert(phone: string, message: string): Promise<boolean> {
    try {
      await this.smsService.sendNotification(phone, message);
      return true;
    } catch (error) {
      this.logger.warn(
        `Falha ao enviar SMS de alerta de bateria: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return false;
    }
  }
}
