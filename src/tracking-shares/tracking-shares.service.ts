import {
  BadRequestException,
  GoneException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { LocationsService } from '../locations/locations.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { CreateTrackingShareDto } from './dto/tracking-share.dto';
import { TrackingShare } from './entities/tracking-share.entity';

function todayRangeIso(): { from: string; to: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return {
    from: start.toISOString(),
    to: end.toISOString(),
  };
}

@Injectable()
export class TrackingSharesService {
  constructor(
    @InjectRepository(TrackingShare)
    private readonly sharesRepository: Repository<TrackingShare>,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly locationsService: LocationsService,
    private readonly config: ConfigService,
  ) {}

  private buildShareUrl(token: string): string {
    const configured = this.config.get<string>('WEB_PUBLIC_ORIGIN');
    const base = configured?.replace(/\/$/, '') ?? 'http://localhost:5173';
    return `${base}/acompanhar/${token}`;
  }

  private isShareActive(share: TrackingShare): boolean {
    if (share.revoked_at) {
      return false;
    }
    if (share.expires_at && share.expires_at.getTime() <= Date.now()) {
      return false;
    }
    return true;
  }

  private toShareDto(share: TrackingShare) {
    return {
      id: share.id,
      token: share.token,
      recipient_name: share.recipient_name,
      expires_at: share.expires_at?.toISOString() ?? null,
      created_at: share.created_at.toISOString(),
      share_url: this.buildShareUrl(share.token),
      is_active: this.isShareActive(share),
    };
  }

  async createShare(
    userId: string,
    subscriptionId: string,
    dto: CreateTrackingShareDto,
  ) {
    const subscription = await this.subscriptionsService.findByIdForUser(
      subscriptionId,
      userId,
    );

    if (!subscription.device_id) {
      throw new BadRequestException(
        'Ative o IMEI do equipamento antes de compartilhar o rastreio',
      );
    }

    if (!this.subscriptionsService.isActive(subscription)) {
      throw new BadRequestException('Assinatura inativa — não é possível compartilhar');
    }

    const token = randomBytes(24).toString('base64url');
    const expiresAt =
      dto.expires_in_hours != null
        ? new Date(Date.now() + dto.expires_in_hours * 60 * 60 * 1000)
        : null;

    const share = this.sharesRepository.create({
      token,
      user_id: userId,
      subscription_id: subscription.id,
      device_id: subscription.device_id,
      recipient_name: dto.recipient_name.trim(),
      expires_at: expiresAt,
    });

    const saved = await this.sharesRepository.save(share);
    return this.toShareDto(saved);
  }

  async listShares(userId: string, subscriptionId: string) {
    await this.subscriptionsService.findByIdForUser(subscriptionId, userId);

    const shares = await this.sharesRepository.find({
      where: { subscription_id: subscriptionId, user_id: userId, deleted_at: IsNull() },
      order: { created_at: 'DESC' },
    });

    return {
      shares: shares.map((share) => this.toShareDto(share)),
    };
  }

  async revokeShare(userId: string, subscriptionId: string, shareId: string) {
    await this.subscriptionsService.findByIdForUser(subscriptionId, userId);

    const share = await this.sharesRepository.findOne({
      where: { id: shareId, subscription_id: subscriptionId, user_id: userId },
    });

    if (!share) {
      throw new NotFoundException('Link de compartilhamento não encontrado');
    }

    if (!share.revoked_at) {
      share.revoked_at = new Date();
      await this.sharesRepository.save(share);
    }

    return this.toShareDto(share);
  }

  async dismissShare(userId: string, subscriptionId: string, shareId: string) {
    await this.subscriptionsService.findByIdForUser(subscriptionId, userId);

    const share = await this.sharesRepository.findOne({
      where: { id: shareId, subscription_id: subscriptionId, user_id: userId, deleted_at: IsNull() },
    });

    if (!share) {
      throw new NotFoundException('Link de compartilhamento não encontrado');
    }

    if (this.isShareActive(share)) {
      throw new BadRequestException('Encerre o link antes de removê-lo da lista');
    }

    share.deleted_at = new Date();
    await this.sharesRepository.save(share);
  }

  private async resolveActiveShare(token: string): Promise<TrackingShare> {
    const share = await this.sharesRepository.findOne({
      where: { token },
      relations: { subscription: true },
    });

    if (!share) {
      throw new NotFoundException('Link de rastreio não encontrado');
    }

    if (share.deleted_at) {
      throw new NotFoundException('Link de rastreio não encontrado');
    }

    if (share.revoked_at) {
      throw new GoneException('Este link de rastreio foi encerrado');
    }

    if (share.expires_at && share.expires_at.getTime() <= Date.now()) {
      throw new GoneException('Este link de rastreio expirou');
    }

    const subscription = share.subscription;
    if (!subscription || !this.subscriptionsService.isActive(subscription)) {
      throw new GoneException('Rastreio indisponível no momento');
    }

    return share;
  }

  async getPublicTracking(
    token: string,
    options: { since?: string; limit?: number } = {},
  ) {
    const share = await this.resolveActiveShare(token);
    const day = todayRangeIso();
    const limit = options.limit ?? 200;

    const locations = options.since
      ? await this.locationsService.findLatestByDevice(share.device_id, {
          limit,
          from: new Date(new Date(options.since).getTime() + 1).toISOString(),
          to: day.to,
        })
      : await this.locationsService.findRouteByDevice(share.device_id, {
          limit,
          from: day.from,
          to: day.to,
        });

    const ordered = [...locations].sort(
      (a, b) =>
        new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime(),
    );

    return {
      recipient_name: share.recipient_name,
      device_label: share.subscription?.label ?? 'Rastreador',
      device_icon: share.subscription?.icon ?? 'vehicle',
      expires_at: share.expires_at?.toISOString() ?? null,
      locations: ordered.map((location) => ({
        id: location.id,
        latitude: location.latitude,
        longitude: location.longitude,
        speed_knots: location.speed_knots,
        battery_percent: location.battery_percent,
        location_source: location.location_source,
        is_valid: location.is_valid,
        recorded_at: location.recorded_at,
        received_at: location.received_at.toISOString(),
      })),
    };
  }

  async countActiveSharesForDevice(deviceId: string): Promise<number> {
    const now = new Date();
    return this.sharesRepository.count({
      where: [
        {
          device_id: deviceId,
          revoked_at: IsNull(),
          expires_at: IsNull(),
        },
        {
          device_id: deviceId,
          revoked_at: IsNull(),
          expires_at: MoreThan(now),
        },
      ],
    });
  }
}
