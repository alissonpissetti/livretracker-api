import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { LocationsModule } from '../locations/locations.module';
import { StoreModule } from '../store/store.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { AccountController } from './account.controller';

@Module({
  imports: [AuthModule, StoreModule, SubscriptionsModule, LocationsModule],
  controllers: [AccountController],
})
export class AccountModule {}
