import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { formatBrl } from '../store/products.service';
import { CreateVoucherDto } from './dto/voucher.dto';
import { Voucher } from './entities/voucher.entity';

export type VoucherQuote = {
  voucher: Voucher;
  subtotal_cents: number;
  discount_cents: number;
  total_cents: number;
  subtotal_label: string;
  discount_label: string;
  total_label: string;
};

@Injectable()
export class VouchersService {
  constructor(
    @InjectRepository(Voucher)
    private readonly vouchersRepository: Repository<Voucher>,
  ) {}

  normalizeCode(code: string): string {
    return code.trim().toUpperCase();
  }

  async create(dto: CreateVoucherDto): Promise<Voucher> {
    const code = this.normalizeCode(dto.code);

    const existing = await this.vouchersRepository.findOne({ where: { code } });
    if (existing) {
      throw new ConflictException(`Voucher ${code} já existe`);
    }

    if (dto.discount_type === 'percent' && dto.discount_value > 100) {
      throw new BadRequestException('Desconto percentual não pode passar de 100%');
    }

    return this.vouchersRepository.save(
      this.vouchersRepository.create({
        code,
        discount_type: dto.discount_type,
        discount_value: dto.discount_value,
        max_uses: dto.max_uses ?? null,
        expires_at: dto.expires_at ? new Date(dto.expires_at) : null,
        min_order_cents: dto.min_order_cents ?? 0,
        description: dto.description?.trim() || null,
      }),
    );
  }

  async findAll(): Promise<Voucher[]> {
    return this.vouchersRepository.find({ order: { created_at: 'DESC' } });
  }

  async findById(id: string): Promise<Voucher> {
    const voucher = await this.vouchersRepository.findOne({ where: { id } });
    if (!voucher) {
      throw new NotFoundException('Voucher não encontrado');
    }
    return voucher;
  }

  async setActive(id: string, active: boolean): Promise<Voucher> {
    const voucher = await this.findById(id);
    voucher.active = active;
    return this.vouchersRepository.save(voucher);
  }

  async quote(codeInput: string, subtotalCents: number): Promise<VoucherQuote> {
    const voucher = await this.getValidVoucher(codeInput, subtotalCents);
    const discountCents = this.calculateDiscount(voucher, subtotalCents);
    const totalCents = Math.max(0, subtotalCents - discountCents);

    return {
      voucher,
      subtotal_cents: subtotalCents,
      discount_cents: discountCents,
      total_cents: totalCents,
      subtotal_label: formatBrl(subtotalCents),
      discount_label: formatBrl(discountCents),
      total_label: formatBrl(totalCents),
    };
  }

  async redeem(voucher: Voucher): Promise<void> {
    voucher.used_count += 1;
    await this.vouchersRepository.save(voucher);
  }

  private async getValidVoucher(
    codeInput: string,
    subtotalCents: number,
  ): Promise<Voucher> {
    const code = this.normalizeCode(codeInput);
    if (!code) {
      throw new BadRequestException('Informe o código do voucher');
    }

    const voucher = await this.vouchersRepository.findOne({ where: { code } });
    if (!voucher) {
      throw new NotFoundException('Voucher inválido ou inexistente');
    }

    if (!voucher.active) {
      throw new BadRequestException('Este voucher está desativado');
    }

    if (voucher.expires_at && voucher.expires_at.getTime() < Date.now()) {
      throw new BadRequestException('Este voucher expirou');
    }

    if (
      voucher.max_uses != null &&
      voucher.used_count >= voucher.max_uses
    ) {
      throw new BadRequestException('Este voucher atingiu o limite de usos');
    }

    if (subtotalCents < voucher.min_order_cents) {
      throw new BadRequestException(
        `Pedido mínimo para este voucher: ${formatBrl(voucher.min_order_cents)}`,
      );
    }

    return voucher;
  }

  private calculateDiscount(voucher: Voucher, subtotalCents: number): number {
    if (voucher.discount_type === 'percent') {
      return Math.min(
        subtotalCents,
        Math.round((subtotalCents * voucher.discount_value) / 100),
      );
    }

    return Math.min(subtotalCents, voucher.discount_value);
  }

  formatVoucher(voucher: Voucher) {
    const discountLabel =
      voucher.discount_type === 'percent'
        ? `${voucher.discount_value}%`
        : formatBrl(voucher.discount_value);

    return {
      id: voucher.id,
      code: voucher.code,
      discount_type: voucher.discount_type,
      discount_value: voucher.discount_value,
      discount_label: discountLabel,
      active: voucher.active,
      max_uses: voucher.max_uses,
      used_count: voucher.used_count,
      expires_at: voucher.expires_at?.toISOString() ?? null,
      min_order_cents: voucher.min_order_cents,
      min_order_label:
        voucher.min_order_cents > 0
          ? formatBrl(voucher.min_order_cents)
          : null,
      description: voucher.description,
      created_at: voucher.created_at.toISOString(),
    };
  }
}
