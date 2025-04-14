import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { TokenDto } from './dto/token.dto';
import { AppConfigService } from '../config/config.service';
import { User } from '../users/entities/user.entity';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: AppConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersService.validateUserPassword(email, password);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    if (!user.isActive) {
      throw new UnauthorizedException('User is not active');
    }
    
    return user;
  }

  async login(loginDto: LoginDto): Promise<TokenDto> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    
    const tokens = await this.getTokens(user);
    
    await this.usersService.setRefreshToken(user.id, tokens.refreshToken);
    
    return tokens;
  }

  async refreshTokens(userId: number, refreshToken: string): Promise<TokenDto> {
    const user = await this.usersService.getUserIfRefreshTokenMatches(
      userId,
      refreshToken,
    );
    
    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    
    const tokens = await this.getTokens(user);
    
    await this.usersService.setRefreshToken(user.id, tokens.refreshToken);
    
    return tokens;
  }

  async logout(userId: number): Promise<void> {
    await this.usersService.setRefreshToken(userId, null);
  }

  async validateToken(token: string): Promise<{ valid: boolean; user?: JwtPayload }> {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.jwtSecret,
      }) as JwtPayload;
      
      const user = await this.usersService.findOne(payload.sub);
      
      if (!user || !user.isActive) {
        return { valid: false };
      }
      
      return { 
        valid: true, 
        user: {
          sub: user.id,
          email: user.email,
          role: user.role,
        },
      };
    } catch (error) {
      return { valid: false };
    }
  }

  async getTokens(user: User): Promise<TokenDto> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.jwtSecret,
        expiresIn: this.configService.jwtExpiresIn,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.jwtSecret,
        expiresIn: this.configService.jwtRefreshExpiresIn,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
} 