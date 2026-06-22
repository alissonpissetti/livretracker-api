import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComteleModule } from '../plugins/comtele/comtele.module';
import { UsersModule } from '../users/users.module';
import { LoginOtp } from './entities/login-otp.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AdminGuard } from './admin.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { OtpService } from './otp.service';
import { SmsService } from './sms.service';

@Module({
  imports: [
    UsersModule,
    ComteleModule,
    TypeOrmModule.forFeature([LoginOtp]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'livre-tracker-dev-secret'),
        signOptions: { expiresIn: '30d' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, OtpService, SmsService, JwtAuthGuard, AdminGuard],
  exports: [AuthService, JwtAuthGuard, AdminGuard, JwtModule, SmsService],
})
export class AuthModule {}
