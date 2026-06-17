import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

const PHONE_PATTERN = /^\+?[1-9]\d{9,14}$/;

export class RegisterDto {
  @ApiProperty({ example: 'Maria Silva' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'maria@email.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+5511987654321' })
  @IsString()
  @Matches(PHONE_PATTERN, {
    message: 'Telefone inválido. Use o formato internacional, ex: +5511987654321',
  })
  phone: string;

  @ApiProperty({ example: 'senha-segura-123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;
}

export class LoginDto {
  @ApiProperty({ example: 'maria@email.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'senha-segura-123' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class VerifyLoginOtpDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  login_challenge_token: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'Código deve ter 6 dígitos' })
  code: string;
}

export class ResendLoginOtpDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  login_challenge_token: string;
}

export class RecoverPasswordRequestDto {
  @ApiProperty({ example: '+5511987654321' })
  @IsString()
  @Matches(PHONE_PATTERN, {
    message: 'Telefone inválido. Use o formato internacional, ex: +5511987654321',
  })
  phone: string;
}

export class RecoverPasswordResetDto {
  @ApiProperty({ example: '+5511987654321' })
  @IsString()
  @Matches(PHONE_PATTERN, {
    message: 'Telefone inválido. Use o formato internacional, ex: +5511987654321',
  })
  phone: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'Código deve ter 6 dígitos' })
  code: string;

  @ApiProperty({ example: 'nova-senha-segura', minLength: 8 })
  @IsString()
  @MinLength(8)
  new_password: string;
}
