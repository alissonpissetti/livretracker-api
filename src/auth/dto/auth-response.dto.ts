import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'maria@email.com' })
  email: string;

  @ApiProperty({ example: 'Maria Silva' })
  name: string;

  @ApiPropertyOptional({ example: '+5511987654321' })
  phone?: string | null;

  @ApiProperty({ enum: ['customer', 'admin'], example: 'customer' })
  role: string;

  @ApiProperty()
  created_at: string;
}

export class AuthResponseDto {
  @ApiProperty()
  access_token: string;

  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;
}

export class LoginChallengeResponseDto {
  @ApiProperty()
  login_challenge_token: string;

  @ApiProperty({ example: '****4321' })
  phone_mask: string;

  @ApiProperty({ example: 600 })
  expires_in: number;

  @ApiProperty({ example: 'Enviamos um código por SMS para confirmar o login.' })
  message: string;
}

export class PhoneLoginRequestResponseDto {
  @ApiProperty({ example: '****4321' })
  phone_mask: string;

  @ApiProperty({
    example: 'Se o telefone estiver cadastrado, enviamos um código por SMS.',
  })
  message: string;
}

export class RecoverPasswordRequestResponseDto {
  @ApiProperty({ example: '****4321' })
  phone_mask: string;

  @ApiProperty({ example: 'Se o telefone estiver cadastrado, enviamos um código por SMS.' })
  message: string;
}
