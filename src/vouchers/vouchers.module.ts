import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Voucher } from './entities/voucher.entity';
import { VouchersService } from './vouchers.service';

@Module({
  imports: [TypeOrmModule.forFeature([Voucher])],
  providers: [VouchersService],
  exports: [VouchersService],
})
export class VouchersModule {}
