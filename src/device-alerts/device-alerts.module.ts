import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { DeviceAlertsService } from './device-alerts.service';

@Module({
  imports: [TypeOrmModule.forFeature([Subscription]), AuthModule],
  providers: [DeviceAlertsService],
  exports: [DeviceAlertsService],
})
export class DeviceAlertsModule {}
