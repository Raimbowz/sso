import { Controller, Get, Delete, Param, Inject } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    //@Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // @Delete('cache/user/:userId')
  // async clearUserCache(@Param('userId') userId: string) {
  //   const cacheKey = `user_${userId}`;
  //   await this.cacheManager.del(cacheKey);
  //   return { message: `Кэш для пользователя ${userId} сброшен` };
  // }
}
