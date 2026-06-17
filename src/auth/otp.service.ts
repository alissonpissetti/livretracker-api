import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { LessThan, Repository } from 'typeorm';
import { maskPhone } from '../users/phone.util';
import { User } from '../users/entities/user.entity';
import { LoginOtp, LoginOtpPurpose } from './entities/login-otp.entity';
import { SmsService } from './sms.service';

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

@Injectable()
export class OtpService {
  constructor(
    @InjectRepository(LoginOtp)
    private readonly otpRepository: Repository<LoginOtp>,
    private readonly smsService: SmsService,
  ) {}

  async issueAndSend(
    user: User,
    purpose: LoginOtpPurpose,
  ): Promise<{ phone_mask: string }> {
    if (!user.phone) {
      throw new BadRequestException('Usuário sem telefone cadastrado');
    }

    await this.otpRepository.delete({ user_id: user.id, purpose });

    const code = this.generateCode();
    const code_hash = await bcrypt.hash(code, 10);
    const expires_at = new Date(Date.now() + OTP_TTL_MS);

    await this.otpRepository.save(
      this.otpRepository.create({
        user_id: user.id,
        code_hash,
        purpose,
        expires_at,
      }),
    );

    await this.smsService.sendOtp(user.phone, code);

    return { phone_mask: maskPhone(user.phone) };
  }

  async verify(
    userId: string,
    purpose: LoginOtpPurpose,
    code: string,
  ): Promise<void> {
    const otp = await this.otpRepository.findOne({
      where: { user_id: userId, purpose },
      order: { created_at: 'DESC' },
    });

    if (!otp) {
      throw new UnauthorizedException('Código inválido ou expirado');
    }

    if (otp.expires_at.getTime() < Date.now()) {
      await this.otpRepository.delete({ id: otp.id });
      throw new UnauthorizedException('Código expirado');
    }

    if (otp.attempts >= MAX_ATTEMPTS) {
      await this.otpRepository.delete({ id: otp.id });
      throw new UnauthorizedException('Muitas tentativas. Solicite um novo código');
    }

    const valid = await bcrypt.compare(code, otp.code_hash);
    if (!valid) {
      otp.attempts += 1;
      await this.otpRepository.save(otp);
      throw new UnauthorizedException('Código inválido');
    }

    await this.otpRepository.delete({ id: otp.id });
  }

  async purgeExpired(): Promise<void> {
    await this.otpRepository.delete({
      expires_at: LessThan(new Date()),
    });
  }

  private generateCode(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
  }
}
