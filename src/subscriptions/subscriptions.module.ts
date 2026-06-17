import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DevicesModule } from '../devices/devices.module';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionsService } from './subscriptions.service';

@Module({
  imports: [TypeOrmModule.forFeature([Subscription]), DevicesModule],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
