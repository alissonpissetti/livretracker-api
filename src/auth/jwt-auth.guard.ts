import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AuthUser, JwtPayload } from './auth-user.interface';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authorization = request.header('authorization') ?? '';
    const [scheme, token] = authorization.split(' ');

    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      throw new UnauthorizedException('Faça login para continuar');
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.config.get<string>('JWT_SECRET', 'livre-tracker-dev-secret'),
      });

      (request as Request & { user: AuthUser }).user = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        role: payload.role ?? 'customer',
      };

      return true;
    } catch {
      throw new UnauthorizedException('Sessão inválida ou expirada');
    }
  }
}
