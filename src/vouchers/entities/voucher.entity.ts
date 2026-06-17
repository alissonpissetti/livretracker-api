import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type VoucherDiscountType = 'percent' | 'fixed';

@Entity('vouchers')
export class Voucher {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ length: 32 })
  code: string;

  @Column({ length: 16 })
  discount_type: VoucherDiscountType;

  /** Percentual (1–100) ou valor fixo em centavos. */
  @Column({ type: 'int' })
  discount_value: number;

  @Column({ default: true })
  active: boolean;

  @Column({ type: 'int', nullable: true })
  max_uses: number | null;

  @Column({ type: 'int', default: 0 })
  used_count: number;

  @Column({ type: 'datetime', nullable: true })
  expires_at: Date | null;

  @Column({ type: 'int', default: 0 })
  min_order_cents: number;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @CreateDateColumn()
  created_at: Date;
}
