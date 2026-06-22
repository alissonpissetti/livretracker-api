import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { OptionalBearerGuard } from '../auth/optional-bearer.guard';
import { DevicesController } from './devices.controller';
import { Device } from './entities/device.entity';
import { DevicesService } from './devices.service';

@Module({
  imports: [TypeOrmModule.forFeature([Device]), AuthModule],
  controllers: [DevicesController],
  providers: [DevicesService, OptionalBearerGuard],
  exports: [DevicesService],
})
export class DevicesModule {}
