import {
  Body, Controller, Delete, Get, Param, Post, Put, Query,
} from '@nestjs/common'
import { IsPublic, Roles } from 'src/decorators/guard.decorator'
import { formatPages } from 'src/utils/page'
import { CreateUser } from './dto/create-user.dto'
import { SignindDto } from './dto/signin.dto'
import { UpdateUserInfoDto } from './dto/update-user-info.dto'
import {
  SearchUserParams, SearchUserQueryPipe, UserService,
} from './user.service'

@Controller('/api/user')
export class UserController {
  constructor(private readonly service: UserService) {}

  @IsPublic()
  @Post('signin')
  signin(@Body() dto: SignindDto) {
    return this.service.signin(dto)
  }

  @Roles('admin')
  @Post('new')
  async create(@Body() dto: CreateUser) {
    const data = await this.service.create(dto)
    return this.service.buildRO(data)
  }

  @Get('search')
  async search(@Body(SearchUserQueryPipe) query: SearchUserParams) {
    const datas = await this.service.search(query)
    return formatPages(datas, this.service.buildRO)
  }

  @Get('email/:email')
  async getByEmail(@Param('email') email: string) {
    const data = await this.service.getByEmail(email)
    return this.service.buildRO(data)
  }

  @Get('phone/:phone')
  async getByPhone(@Param('phone') phone: string) {
    const data = await this.service.getByPhone(phone)
    return this.service.buildRO(data)
  }

  @IsPublic()
  @Get(':id')
  async getById(@Param('id') id: string) {
    const data = await this.service.getById(id)
    return this.service.buildRO(data)
  }

  @Put(':id')
  async updateInfo(@Param('id') id: string, @Body() dto: UpdateUserInfoDto) {
    return this.service.updateInfo(id, dto)
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.service.delete(id)
  }
}
