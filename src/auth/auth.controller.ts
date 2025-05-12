import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
  Delete,
  Param,
  ParseIntPipe,
  Inject,
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
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CacheHttpClientService } from '../cache-http-client.service';

class ValidateTokenDto {
  token: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly cacheHttpClient: CacheHttpClientService,
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
    const key = `auth_login_${loginDto.email}`;
    return this.cacheHttpClient.getOrSet(
      key,
      86400,
      () => this.authService.login(loginDto),
    );
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
    const decoded = this.authService['jwtService'].decode(
      refreshTokenDto.refreshToken,
    ) as JwtPayload;
    const key = `auth_refresh_${decoded.sub}`;
    return this.cacheHttpClient.getOrSet(
      key,
      86400,
      () => this.authService.refreshTokens(
        decoded.sub,
        refreshTokenDto.refreshToken,
      ),
    );
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
    const key = `auth_validate_${validateTokenDto.token}`;
    return this.cacheHttpClient.getOrSet(
      key,
      86400,
      () => this.authService.validateToken(validateTokenDto.token),
    );
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

  @Delete('cache/login/:userId')
  async clearLoginCache(@Param('userId', ParseIntPipe) userId: number) {
    await this.cacheHttpClient['cacheManager'].del(`auth_login_${userId}`);
    return { message: `Кэш логина пользователя ${userId} сброшен` };
  }

  @Delete('cache/refresh/:userId')
  async clearRefreshCache(@Param('userId', ParseIntPipe) userId: number) {
    await this.cacheHttpClient['cacheManager'].del(`auth_refresh_${userId}`);
    return { message: `Кэш refresh пользователя ${userId} сброшен` };
  }

  @Delete('cache/validate/:userId')
  async clearValidateCache(@Param('userId', ParseIntPipe) userId: number) {
    await this.cacheHttpClient['cacheManager'].del(`auth_validate_${userId}`);
    return { message: `Кэш validate пользователя ${userId} сброшен` };
  }

  @Delete('cache/logout/:userId')
  async clearLogoutCache(@Param('userId', ParseIntPipe) userId: number) {
    await this.cacheHttpClient['cacheManager'].del(`auth_logout_${userId}`);
    return { message: `Кэш logout пользователя ${userId} сброшен` };
  }
} 