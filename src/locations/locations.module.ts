import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OptionalBearerGuard } from '../auth/optional-bearer.guard';
import { DeviceAlertsModule } from '../device-alerts/device-alerts.module';
import { DevicesModule } from '../devices/devices.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { Location } from './entities/location.entity';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Location]),
    DevicesModule,
    SubscriptionsModule,
    DeviceAlertsModule,
  ],
  controllers: [LocationsController],
  providers: [LocationsService, OptionalBearerGuard],
  exports: [LocationsService],
})
export class LocationsModule {}
