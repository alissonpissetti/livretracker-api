import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AuthUser } from './auth-user.interface';
import { JwtAuthGuard } from './jwt-auth.guard';

@Injectable()
export class AdminGuard extends JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    super.canActivate(context);

    const request = context.switchToHttp().getRequest<{ user: AuthUser }>();
    if (request.user?.role !== 'admin') {
      throw new ForbiddenException('Acesso restrito a administradores');
    }

    return true;
  }
}
