import {
  Body, Controller, Delete, Get, Param, Post, Put, UseGuards,
} from '@nestjs/common'
import { Roles } from 'src/decorators/guard.decorator'
import { RolesGuard } from 'src/guards/roles.guard'
import { CreateUserByPhoneDto } from './dto/create-user-by-phone.dto'
import { SigninWithPasswordDto } from './dto/signin.dto'
import { UpdateUserInfoDto } from './dto/update-user-info.dto'
import { UserService } from './user.service'

@Controller('/api/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('signin')
  signinWithPassword(@Body() dto: SigninWithPasswordDto) {
    return this.userService.signinWithPassword(dto)
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.userService.getUniqueUser({ type: 'id', value: id })
  }

  // @Roles('admin')
  // @UseGuards(RolesGuard)
  @Get('search/email/:email')
  getByEmail(@Param('email') email: string) {
    return this.userService.getUniqueUser({ type: 'email', value: email })
  }

  @Get('search/phone/:phone')
  getByPhone(@Param('phone') phone: string) {
    return this.userService.getUniqueUser({ type: 'phone', value: phone })
  }

  @Get('search/nickname/:nickname')
  getsByNickname(@Param('nickname') nickname: string) {
    return this.userService.getUsers({ type: 'nickname', value: nickname })
  }

  @Post('phone')
  async createByPhone(@Body() dto: CreateUserByPhoneDto) {
    return this.userService.createByPhone(dto)
  }

  @Put(':id')
  async updateUserInfo(@Param('id') id: string, @Body() dto: UpdateUserInfoDto) {
    return this.userService.updateUserInfo(id, dto)
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.userService.delete(id)
  }
}
