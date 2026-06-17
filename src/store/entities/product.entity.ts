import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type ProductType = 'hardware' | 'subscription';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 64, unique: true })
  slug: string;

  @Column({ length: 120 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ length: 16 })
  type: ProductType;

  @Column({ type: 'int' })
  price_cents: number;

  @Column({ default: true })
  active: boolean;

  @Column({ type: 'int', nullable: true })
  subscription_days?: number;

  @CreateDateColumn()
  created_at: Date;
}
