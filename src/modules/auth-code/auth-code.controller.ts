import {
  Body, Controller, Post,
} from '@nestjs/common'
import { IsPublic } from 'src/decorators/guard.decorator'
import { AuthCodeService } from './auth-code.service'
import { CreateAuthCodeDto } from './dto/create-auth-code.dto'

@Controller('/api/auth-code')
export class AuthCodeController {
  constructor(private readonly authCodeService: AuthCodeService) {}

  // @TODO: 调用频率需要额外限制
  @IsPublic()
  @Post('new')
  async createAuthCode(@Body() dto: CreateAuthCodeDto) {
    return this.authCodeService.create(dto)
  }
}
