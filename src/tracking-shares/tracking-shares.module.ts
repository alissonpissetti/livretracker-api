import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationsModule } from '../locations/locations.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { TrackingShare } from './entities/tracking-share.entity';
import { PublicTrackingController } from './public-tracking.controller';
import { TrackingSharesService } from './tracking-shares.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([TrackingShare]),
    SubscriptionsModule,
    LocationsModule,
  ],
  controllers: [PublicTrackingController],
  providers: [TrackingSharesService],
  exports: [TrackingSharesService],
})
export class TrackingSharesModule {}
