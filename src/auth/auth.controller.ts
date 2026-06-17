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
  PhoneLoginRequestDto,
  PhoneLoginVerifyDto,
  RecoverPasswordRequestDto,
  RecoverPasswordResetDto,
  RegisterDto,
} from './dto/auth.dto';
import {
  AuthResponseDto,
  PhoneLoginRequestResponseDto,
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
  @ApiOperation({ summary: 'Entrar com e-mail e senha' })
  @ApiOkResponse({ type: AuthResponseDto })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('login/phone')
  @ApiOperation({ summary: 'Solicitar código SMS para login por telefone' })
  @ApiOkResponse({ type: PhoneLoginRequestResponseDto })
  requestPhoneLogin(@Body() dto: PhoneLoginRequestDto) {
    return this.authService.requestPhoneLogin(dto);
  }

  @Post('login/phone/verify')
  @ApiOperation({ summary: 'Confirmar login por telefone com código SMS' })
  @ApiOkResponse({ type: AuthResponseDto })
  verifyPhoneLogin(@Body() dto: PhoneLoginVerifyDto) {
    return this.authService.verifyPhoneLogin(dto);
  }

  @Post('login/phone/resend')
  @ApiOperation({ summary: 'Reenviar código SMS do login por telefone' })
  @ApiOkResponse({ type: PhoneLoginRequestResponseDto })
  resendPhoneLogin(@Body() dto: PhoneLoginRequestDto) {
    return this.authService.resendPhoneLogin(dto);
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
