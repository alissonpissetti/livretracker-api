import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  PhoneLoginRequestDto,
  PhoneLoginVerifyDto,
  RecoverPasswordRequestDto,
  RecoverPasswordResetDto,
  RegisterDto,
} from './dto/auth.dto';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { OtpService } from './otp.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly otpService: OtpService,
  ) {}

  async register(dto: RegisterDto) {
    const user = await this.usersService.create(
      dto.name,
      dto.email,
      dto.password,
      dto.phone,
    );
    return this.buildAuthResponse(user);
  }

  async login(email: string, password: string) {
    const user = await this.usersService.validateCredentials(email, password);
    if (!user) {
      throw new UnauthorizedException('E-mail ou senha inválidos');
    }

    return this.buildAuthResponse(user);
  }

  async requestPhoneLogin(dto: PhoneLoginRequestDto) {
    const user = await this.usersService.findByPhone(dto.phone);
    const genericMessage =
      'Se o telefone estiver cadastrado, enviamos um código por SMS.';

    if (!user?.phone) {
      return {
        phone_mask: '****',
        message: genericMessage,
      };
    }

    const { phone_mask } = await this.otpService.issueAndSend(user, 'login');

    return {
      phone_mask,
      message: genericMessage,
    };
  }

  async verifyPhoneLogin(dto: PhoneLoginVerifyDto) {
    const user = await this.usersService.findByPhone(dto.phone);
    if (!user) {
      throw new UnauthorizedException('Telefone ou código inválidos');
    }

    await this.otpService.verify(user.id, 'login', dto.code);
    return this.buildAuthResponse(user);
  }

  async resendPhoneLogin(dto: PhoneLoginRequestDto) {
    const user = await this.usersService.findByPhone(dto.phone);
    const genericMessage =
      'Se o telefone estiver cadastrado, enviamos um código por SMS.';

    if (!user?.phone) {
      return {
        phone_mask: '****',
        message: genericMessage,
      };
    }

    const { phone_mask } = await this.otpService.issueAndSend(user, 'login');

    return {
      phone_mask,
      message: 'Novo código enviado por SMS.',
    };
  }

  async requestPasswordRecovery(dto: RecoverPasswordRequestDto) {
    const user = await this.usersService.findByPhone(dto.phone);
    const genericMessage =
      'Se o telefone estiver cadastrado, enviamos um código por SMS.';

    if (!user?.phone) {
      return {
        phone_mask: '****',
        message: genericMessage,
      };
    }

    const { phone_mask } = await this.otpService.issueAndSend(user, 'recover');

    return {
      phone_mask,
      message: genericMessage,
    };
  }

  async resetPasswordWithOtp(dto: RecoverPasswordResetDto) {
    const user = await this.usersService.findByPhone(dto.phone);
    if (!user) {
      throw new UnauthorizedException('Telefone ou código inválidos');
    }

    await this.otpService.verify(user.id, 'recover', dto.code);
    const updated = await this.usersService.updatePassword(
      user.id,
      dto.new_password,
    );

    return this.buildAuthResponse(updated);
  }

  async me(userId: string) {
    return this.formatUser(await this.usersService.findById(userId));
  }

  private buildAuthResponse(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload, {
        secret: this.config.get<string>('JWT_SECRET', 'livre-tracker-dev-secret'),
        expiresIn: '30d',
      }),
      user: this.formatUser(user),
    };
  }

  private formatUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      created_at: user.created_at.toISOString(),
    };
  }
}
