import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Inject,
  Req,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserRole } from './entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
 
@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
 
  ) {}

  @Post()
  @Roles(UserRole.ADMIN,UserRole.CREATOR)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiCreatedResponse({ type: User, description: 'The user has been successfully created' })
  create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(UserRole.ADMIN,UserRole.CREATOR)
  @ApiOperation({ summary: 'Get all users' })
  @ApiOkResponse({ type: [User], description: 'List of all users' })
  async findAll(@Req() req: any): Promise<User[]> {
 
    return this.usersService.findAll()
  }

  @Get('profile/:id')
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiOkResponse({ type: User, description: 'The user with the specified ID' })
  async getProfile(@Param('id', ParseIntPipe) id: number): Promise<User> {
    
    return this.usersService.findOne(id)
  }

  @Get('/by-token')
  @Roles(UserRole.ADMIN,UserRole.CREATOR, UserRole.USER, UserRole.MODERATOR, UserRole.DEVELOPER, UserRole.PARTNER)
  @ApiOperation({ summary: 'Get a user by token' })
  @ApiOkResponse({ type: User, description: 'The user with the specified token' })
  async getProfileByToken(@Req() req: any): Promise<User | null> {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      throw new UnauthorizedException('No token provided');
    }
    const token = authHeader.replace('Bearer ', '');
    let payload: any;
    try {
      payload = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
    } catch (e) {
      throw new UnauthorizedException('Invalid token');
    }
    const user = await this.usersService.findOne(payload.id || payload.sub);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  @Get(':id')
  @Roles(UserRole.ADMIN,UserRole.CREATOR)
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiOkResponse({ type: User, description: 'The user with the specified ID' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<User> {
    return this.usersService.findOne(id)
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN,UserRole.CREATOR)
  @ApiOperation({ summary: 'Update a user by ID' })
  @ApiOkResponse({ type: User, description: 'The updated user' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN,UserRole.CREATOR)
  @ApiOperation({ summary: 'Delete a user by ID' })
  @ApiNoContentResponse({ description: 'The user has been successfully deleted' })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.usersService.remove(id);
  }

  // @Delete('cache/all')
  // async clearAllUsersCache() {
  //   await this.cacheHttpClient['cacheManager'].del('users_all');
  //   return { message: 'Кэш всех пользователей сброшен' };
  // }

  // @Delete('cache/:id')
  // async clearUserCache(@Param('id', ParseIntPipe) id: number) {
  //   await this.cacheHttpClient['cacheManager'].del(`user_${id}`);
  //   return { message: `Кэш пользователя с id ${id} сброшен` };
  // }

  // @Delete('cache/find')
  // async clearFindAllCache() {
  //   await this.cacheHttpClient['cacheManager'].del('users_all');
  //   return { message: 'Кэш findAll пользователей сброшен' };
  // }
} 