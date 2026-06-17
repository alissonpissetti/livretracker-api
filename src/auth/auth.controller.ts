import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from './current-user.decorator';
import { AuthUser } from './auth-user.interface';
import { AuthService } from './auth.service';
import {
  LoginDto,
  RecoverPasswordRequestDto,
  RecoverPasswordResetDto,
  RegisterDto,
  ResendLoginOtpDto,
  VerifyLoginOtpDto,
} from './dto/auth.dto';
import {
  AuthResponseDto,
  LoginChallengeResponseDto,
  RecoverPasswordRequestResponseDto,
  UserResponseDto,
} from './dto/auth-response.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('auth')
@Controller('v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Criar conta' })
  @ApiCreatedResponse({ type: AuthResponseDto })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Entrar na conta (etapa 1 — e-mail e senha)' })
  @ApiOkResponse({
    description:
      'Retorna token de acesso direto (admin) ou desafio 2FA por SMS (clientes)',
    schema: {
      oneOf: [
        { $ref: '#/components/schemas/AuthResponseDto' },
        { $ref: '#/components/schemas/LoginChallengeResponseDto' },
      ],
    },
  })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('login/verify-otp')
  @ApiOperation({ summary: 'Confirmar login com código SMS (etapa 2)' })
  @ApiOkResponse({ type: AuthResponseDto })
  verifyLoginOtp(@Body() dto: VerifyLoginOtpDto) {
    return this.authService.verifyLoginOtp(dto);
  }

  @Post('login/resend-otp')
  @ApiOperation({ summary: 'Reenviar código SMS do login' })
  @ApiOkResponse({ type: LoginChallengeResponseDto })
  resendLoginOtp(@Body() dto: ResendLoginOtpDto) {
    return this.authService.resendLoginOtp(dto);
  }

  @Post('recover/request')
  @ApiOperation({ summary: 'Solicitar recuperação de senha por telefone' })
  @ApiOkResponse({ type: RecoverPasswordRequestResponseDto })
  requestPasswordRecovery(@Body() dto: RecoverPasswordRequestDto) {
    return this.authService.requestPasswordRecovery(dto);
  }

  @Post('recover/reset')
  @ApiOperation({ summary: 'Redefinir senha com código SMS' })
  @ApiOkResponse({ type: AuthResponseDto })
  resetPasswordWithOtp(@Body() dto: RecoverPasswordResetDto) {
    return this.authService.resetPasswordWithOtp(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Perfil do usuário logado' })
  @ApiOkResponse({ type: UserResponseDto })
  async me(@CurrentUser() user: AuthUser) {
    return this.authService.me(user.id);
  }
}
