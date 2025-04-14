import { UserRole } from '../../users/entities/user.entity';

export interface JwtPayload {
  sub: number;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
} 