import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { OrderItem } from './order-item.entity';

export type OrderStatus = 'paid' | 'pending';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ length: 120 })
  customer_name: string;

  @Column({ length: 255 })
  customer_email: string;

  @Column({ length: 16, default: 'paid' })
  status: OrderStatus;

  @Column({ type: 'int' })
  total_cents: number;

  @Column({ type: 'int', default: 0 })
  subtotal_cents: number;

  @Column({ type: 'int', default: 0 })
  discount_cents: number;

  @Column({ length: 32, nullable: true })
  voucher_code: string | null;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @CreateDateColumn()
  created_at: Date;
}
