import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { TokenDto } from './dto/token.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

class ValidateTokenDto {
  token: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'User registration' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User has been registered successfully',
    type: User,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad request, e.g. email already exists',
  })
  async register(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User has been logged in successfully',
    type: TokenDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials',
  })
  async login(@Body() loginDto: LoginDto): Promise<TokenDto> {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tokens have been refreshed successfully',
    type: TokenDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid refresh token',
  })
  async refreshTokens(@Body() refreshTokenDto: RefreshTokenDto): Promise<TokenDto> {
    try {
      const decoded = this.authService['jwtService'].decode(
        refreshTokenDto.refreshToken,
      ) as JwtPayload;

      return this.authService.refreshTokens(
        decoded.sub,
        refreshTokenDto.refreshToken,
      );
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  @Post('validate-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate JWT token' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Token is valid',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid token',
  })
  async validateToken(@Body() validateTokenDto: ValidateTokenDto): Promise<{ valid: boolean; user?: JwtPayload }> {
    return this.authService.validateToken(validateTokenDto.token);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'User has been logged out successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  async logout(@Req() req: { user: JwtPayload }): Promise<void> {
    await this.authService.logout(req.user.sub);
  }
} 