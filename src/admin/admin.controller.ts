import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AdminGuard } from '../auth/admin.guard';
import { BlockDeviceDto } from '../devices/dto/block-device.dto';
import {
  CreateVoucherDto,
  UpdateVoucherDto,
} from '../vouchers/dto/voucher.dto';
import { AdminService } from './admin.service';

@ApiTags('admin')
@Controller('v1/admin')
@UseGuards(AdminGuard)
@ApiBearerAuth('bearer')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Resumo geral da plataforma' })
  async overview() {
    return this.adminService.getOverview();
  }

  @Get('users')
  @ApiOperation({ summary: 'Listar contas de clientes' })
  async users() {
    const users = await this.adminService.listUsers();
    return { users };
  }

  @Get('users/:userId')
  @ApiOperation({ summary: 'Detalhe de uma conta com equipamentos e pedidos' })
  @ApiParam({ name: 'userId' })
  async userDetail(@Param('userId') userId: string) {
    return this.adminService.getUserDetail(userId);
  }

  @Get('devices')
  @ApiOperation({
    summary: 'Listar equipamentos e donos',
    description:
      'Mostra cada slot/IMEI, conta vinculada, status da assinatura e telemetria.',
  })
  async devices() {
    const devices = await this.adminService.listManagedDevices();
    return { devices };
  }

  @Get('orders')
  @ApiOperation({ summary: 'Listar todos os pedidos' })
  async orders() {
    const orders = await this.adminService.listOrders();
    return { orders };
  }

  @Get('vouchers')
  @ApiOperation({ summary: 'Listar vouchers de desconto' })
  async vouchers() {
    const vouchers = await this.adminService.listVouchers();
    return { vouchers };
  }

  @Post('vouchers')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar voucher de desconto' })
  async createVoucher(@Body() dto: CreateVoucherDto) {
    const voucher = await this.adminService.createVoucher(dto);
    return { voucher };
  }

  @Patch('vouchers/:voucherId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ativar ou desativar voucher' })
  @ApiParam({ name: 'voucherId' })
  async updateVoucher(
    @Param('voucherId') voucherId: string,
    @Body() dto: UpdateVoucherDto,
  ) {
    const voucher = await this.adminService.updateVoucher(voucherId, dto);
    return { voucher };
  }

  @Patch('devices/:deviceId/block')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bloquear IMEI no rastreamento' })
  @ApiParam({ name: 'deviceId', example: '868123456789012' })
  async block(
    @Param('deviceId') deviceId: string,
    @Body() dto: BlockDeviceDto,
  ) {
    const device = await this.adminService.blockDevice(deviceId, dto.reason);
    return {
      device_id: device.device_id,
      blocked: device.blocked,
      blocked_reason: device.blocked_reason,
    };
  }

  @Patch('devices/:deviceId/unblock')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Desbloquear IMEI' })
  @ApiParam({ name: 'deviceId', example: '868123456789012' })
  async unblock(@Param('deviceId') deviceId: string) {
    const device = await this.adminService.unblockDevice(deviceId);
    return {
      device_id: device.device_id,
      blocked: device.blocked,
    };
  }
}
