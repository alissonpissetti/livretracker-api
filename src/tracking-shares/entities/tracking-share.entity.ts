import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Subscription } from '../../subscriptions/entities/subscription.entity';
import { User } from '../../users/entities/user.entity';

@Entity('tracking_shares')
export class TrackingShare {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ length: 64 })
  token: string;

  @Column()
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  subscription_id: string;

  @ManyToOne(() => Subscription, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subscription_id' })
  subscription: Subscription;

  @Column({ length: 32 })
  device_id: string;

  @Column({ length: 120 })
  recipient_name: string;

  @Column({ type: 'datetime', nullable: true })
  expires_at?: Date | null;

  @Column({ type: 'datetime', nullable: true })
  revoked_at?: Date | null;

  @Column({ type: 'datetime', nullable: true })
  deleted_at?: Date | null;

  @CreateDateColumn()
  created_at: Date;
}
