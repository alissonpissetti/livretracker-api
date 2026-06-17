export type UserRole = 'customer' | 'admin';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  role: UserRole;
}
