import {
  Body, Controller, Delete, Get, Param, Post, Put, Query,
} from '@nestjs/common'
import { IsPublic } from 'src/decorators/guard.decorator'
import { CreateUser } from './dto/create-user.dto'
import { SignindDto } from './dto/signin.dto'
import { UpdateUserInfoDto } from './dto/update-user-info.dto'
import { GetsByNicknameParam, GetsByNicknameQueryPipe, UserService } from './user.service'

@Controller('/api/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @IsPublic()
  @Post('signin')
  signin(@Body() dto: SignindDto) {
    return this.userService.signin(dto)
  }

  @Get('id/:id')
  async getById(@Param('id') id: string) {
    const data = await this.userService.getById(id)
    return this.userService.buildRO(data)
  }

  @Get('email/:email')
  async getByEmail(@Param('email') email: string) {
    const data = await this.userService.getByEmail(email)
    return this.userService.buildRO(data)
  }

  @Get('phone/:phone')
  async getByPhone(@Param('phone') phone: string) {
    const data = await this.userService.getByPhone(phone)
    return this.userService.buildRO(data)
  }

  @Get('nickname/:nickname')
  async getsByNickname(@Query(GetsByNicknameQueryPipe) query: GetsByNicknameParam) {
    const datas = await this.userService.getsByNickname(query)
    return datas.map((item) => this.userService.buildRO(item))
  }

  @Post('new')
  async create(@Body() dto: CreateUser) {
    return this.userService.create(dto)
  }

  @Put(':id')
  async updateInfo(@Param('id') id: string, @Body() dto: UpdateUserInfoDto) {
    return this.userService.updateInfo(id, dto)
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.userService.delete(id)
  }
}
