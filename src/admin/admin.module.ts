import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { DevicesModule } from '../devices/devices.module';
import { Device } from '../devices/entities/device.entity';
import { Order } from '../store/entities/order.entity';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { VouchersModule } from '../vouchers/vouchers.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Subscription, Device, User]),
    AuthModule,
    UsersModule,
    DevicesModule,
    SubscriptionsModule,
    VouchersModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
