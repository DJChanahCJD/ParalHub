import { UserRole } from '../schema/users.schema';

export interface JwtPayload {
  userId: string;
  email: string;
  username: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}
