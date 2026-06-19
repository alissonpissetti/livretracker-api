import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  PublicTrackingQueryDto,
  PublicTrackingResponseDto,
} from './dto/public-tracking.dto';
import { TrackingSharesService } from './tracking-shares.service';

@ApiTags('public')
@Controller('v1/public/track')
export class PublicTrackingController {
  constructor(private readonly trackingSharesService: TrackingSharesService) {}

  @Get(':token')
  @ApiOperation({ summary: 'Rastreio ao vivo via link público (sem login)' })
  @ApiOkResponse({ type: PublicTrackingResponseDto })
  async track(
    @Param('token') token: string,
    @Query() query: PublicTrackingQueryDto,
  ) {
    return this.trackingSharesService.getPublicTracking(token, {
      since: query.since,
      limit: query.limit,
    });
  }
}
