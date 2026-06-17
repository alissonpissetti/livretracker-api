import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateLocationDto } from '../locations/dto/create-location.dto';
import { BlockDeviceDto } from './dto/block-device.dto';
import { Device } from './entities/device.entity';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device)
    private readonly devicesRepository: Repository<Device>,
  ) {}

  async findAll(): Promise<Device[]> {
    return this.devicesRepository.find({
      order: { last_seen_at: 'DESC' },
    });
  }

  async findByDeviceId(deviceId: string): Promise<Device> {
    const device = await this.devicesRepository.findOne({
      where: { device_id: deviceId },
    });

    if (!device) {
      throw new NotFoundException(`Equipamento ${deviceId} não encontrado`);
    }

    return device;
  }

  async assertCanReceiveLocations(deviceId: string): Promise<Device> {
    const device = await this.ensureExists(deviceId);

    if (device.blocked) {
      throw new ForbiddenException(
        `Equipamento ${deviceId} está bloqueado e não pode enviar localizações`,
      );
    }

    return device;
  }

  async touchFromLocation(
    device: Device,
    dto: CreateLocationDto,
  ): Promise<Device> {
    device.last_latitude = dto.latitude;
    device.last_longitude = dto.longitude;
    device.last_location_source = dto.location_source;
    return this.devicesRepository.save(device);
  }

  async block(deviceId: string, dto: BlockDeviceDto): Promise<Device> {
    const device = await this.ensureExists(deviceId);

    device.blocked = true;
    device.blocked_at = new Date();
    device.blocked_reason = dto.reason?.trim() || undefined;

    return this.devicesRepository.save(device);
  }

  async unblock(deviceId: string): Promise<Device> {
    const device = await this.findByDeviceId(deviceId);

    device.blocked = false;
    device.blocked_at = undefined;
    device.blocked_reason = undefined;

    return this.devicesRepository.save(device);
  }

  async ensureExists(deviceId: string): Promise<Device> {
    const normalized = deviceId.trim();
    const existing = await this.devicesRepository.findOne({
      where: { device_id: normalized },
    });

    if (existing) {
      return existing;
    }

    const device = this.devicesRepository.create({ device_id: normalized });
    return this.devicesRepository.save(device);
  }

  private async findOrCreate(deviceId: string): Promise<Device> {
    return this.ensureExists(deviceId);
  }
}
