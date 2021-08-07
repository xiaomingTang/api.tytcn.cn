import {
  Body, Controller, Delete, Get, Param, Post, Put, UseGuards,
} from '@nestjs/common'
import { Roles } from 'src/decorators/guard.decorator'
import { RolesGuard } from 'src/guards/roles.guard'
import { CreateUser } from './dto/create-user.dto'
import { SignindDto } from './dto/signin.dto'
import { UpdateUserInfoDto } from './dto/update-userinfo.dto'
import { UserService } from './user.service'

@Controller('/api/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('signin')
  signin(@Body() dto: SignindDto) {
    return this.userService.signin(dto)
  }

  @Get('id/:id')
  async getById(@Param('id') id: string) {
    const datas = await this.userService.getEntities({ key: 'id', value: id, fuzzy: false, relations: ['roles'] })
    return datas.map((item) => this.userService.buildUserRO(item, {}))[0]
  }

  // @Roles('admin')
  // @UseGuards(RolesGuard)
  @Get('email/:email')
  async getByEmail(@Param('email') email: string) {
    const datas = await this.userService.getEntities({ key: 'email', value: email, fuzzy: false, relations: ['roles'] })
    return datas.map((item) => this.userService.buildUserRO(item, {}))[0]
  }

  @Get('phone/:phone')
  async getByPhone(@Param('phone') phone: string) {
    const datas = await this.userService.getEntities({ key: 'phone', value: phone, fuzzy: false, relations: ['roles'] })
    return datas.map((item) => this.userService.buildUserRO(item, {}))[0]
  }

  @Get('nickname/:nickname')
  async getsByNickname(@Param('nickname') nickname: string) {
    const datas = await this.userService.getEntities({ key: 'nickname', value: nickname, fuzzy: true, relations: ['roles'] })
    return datas.map((item) => this.userService.buildUserRO(item, {}))
  }

  @Post('phone')
  async createByPhone(@Body() dto: CreateUser) {
    return this.userService.createUser(dto)
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
