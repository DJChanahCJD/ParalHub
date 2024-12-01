import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from 'src/types/auth.types';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  // 生成 JWT token
  async generateToken(user: any): Promise<string> {
    if (!user.role) {
      console.warn('User role is missing:', user);
      throw new Error('User role is required');
    }

    const payload: JwtPayload = {
      userId: user._id,
      email: user.email,
      username: user.username,
      role: user.role,
    };

    console.log('Generating token with payload:', payload);
    return this.jwtService.sign(payload);
  }
}
