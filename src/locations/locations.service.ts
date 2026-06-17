import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DevicesService } from '../devices/devices.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { Location } from './entities/location.entity';

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(Location)
    private readonly locationsRepository: Repository<Location>,
    private readonly devicesService: DevicesService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  async create(dto: CreateLocationDto): Promise<Location> {
    const device = await this.devicesService.assertCanReceiveLocations(
      dto.device_id,
    );

    await this.subscriptionsService.assertDeviceCanTrack(dto.device_id);

    const location = this.locationsRepository.create(dto);
    const saved = await this.locationsRepository.save(location);

    await this.devicesService.touchFromLocation(device, dto);

    return saved;
  }

  async findLatestByDevice(
    deviceId: string,
    options: { limit?: number; from?: string; to?: string } = {},
  ): Promise<Location[]> {
    return this.findByDevice(deviceId, { ...options, order: 'desc' });
  }

  async findRouteByDevice(
    deviceId: string,
    options: { limit?: number; from?: string; to?: string } = {},
  ): Promise<Location[]> {
    return this.findByDevice(deviceId, { ...options, order: 'asc' });
  }

  private async findByDevice(
    deviceId: string,
    options: {
      limit?: number;
      from?: string;
      to?: string;
      order?: 'asc' | 'desc';
    } = {},
  ): Promise<Location[]> {
    const limit = Math.min(Math.max(options.limit ?? 20, 1), 500);
    const order = options.order === 'asc' ? 'ASC' : 'DESC';

    const query = this.locationsRepository
      .createQueryBuilder('location')
      .where('location.device_id = :deviceId', { deviceId })
      .orderBy('location.recorded_at', order)
      .addOrderBy('location.received_at', order)
      .take(limit);

    if (options.from) {
      query.andWhere('location.received_at >= :from', {
        from: new Date(options.from),
      });
    }

    if (options.to) {
      query.andWhere('location.received_at <= :to', {
        to: new Date(options.to),
      });
    }

    return query.getMany();
  }
}
