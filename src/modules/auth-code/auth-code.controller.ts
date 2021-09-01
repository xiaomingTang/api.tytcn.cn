import {
  Body, Controller, Post, UseGuards,
} from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { IsPublic } from 'src/decorators/guard.decorator'
import { FriendlyThrottlerGuard } from 'src/guards/friendly-throttle.guard'
import { AuthCodeService } from './auth-code.service'
import { CreateAuthCodeDto } from './dto/create-auth-code.dto'

@Controller('/api/auth-code')
export class AuthCodeController {
  constructor(private readonly service: AuthCodeService) {}

  @UseGuards(FriendlyThrottlerGuard)
  // @TODO: 开发阶段先用 20, 正式环境应该设置为 2
  @Throttle(20, 60)
  @IsPublic()
  @Post('new')
  async createAuthCode(@Body() dto: CreateAuthCodeDto) {
    return this.service.create(dto)
  }
}
