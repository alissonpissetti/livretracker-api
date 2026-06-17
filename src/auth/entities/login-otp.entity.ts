import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type LoginOtpPurpose = 'login' | 'recover';

@Entity('login_otps')
export class LoginOtp {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 36 })
  user_id: string;

  @Column({ length: 255 })
  code_hash: string;

  @Column({ length: 16 })
  purpose: LoginOtpPurpose;

  @Column({ type: 'datetime' })
  expires_at: Date;

  @Column({ type: 'int', default: 0 })
  attempts: number;

  @CreateDateColumn()
  created_at: Date;
}
