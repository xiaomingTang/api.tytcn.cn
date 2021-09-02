import {
  BadRequestException,
  Body, Controller, Delete, Get, Param, Post, Put, Req,
} from '@nestjs/common'
import { Request } from 'express'
import { ADMIN_ID } from 'src/constants'
import { IsPublic, Roles } from 'src/decorators/guard.decorator'
import { onlySomeAccessible } from 'src/utils/auth'
import { formatPages } from 'src/utils/page'
import { CreateUserDto } from './dto/create-user.dto'
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
  async create(@Body() dto: CreateUserDto) {
    const data = await this.service.create(dto)
    return this.service.buildRO(data)
  }

  @Post('search')
  async search(@Body(SearchUserQueryPipe) query: SearchUserParams) {
    const datas = await this.service.search(query)
    return formatPages(datas, this.service.buildRO.bind(this.service))
  }

  @Get('email/:email')
  async getByEmail(@Param('email') email: string) {
    const data = await this.service.getByEmail(email)
    if (!data) {
      throw new BadRequestException('用户不存在')
    }
    return this.service.buildRO(data)
  }

  @Get('phone/:phone')
  async getByPhone(@Param('phone') phone: string) {
    const data = await this.service.getByPhone(phone)
    if (!data) {
      throw new BadRequestException('用户不存在')
    }
    return this.service.buildRO(data)
  }

  /**
   * 该接口目的是为了在登录页调用, 以确认用户当前登录态是否仍有效
   */
  @Get('myself')
  async getMyself() {
    const myself = this.service.getMyself()
    if (!myself) {
      // 由于该接口经过 AuthGuard, 所以正常情况不会执行到这
      throw new BadRequestException('用户不存在')
    }
    return this.service.buildRO(myself)
  }

  /**
   * 当前热门用户
   */
  @Get('hot')
  async getHotUsers() {
    const datas = await this.service.getHotUsers()
    return formatPages(datas, this.service.buildRO.bind(this.service))
  }
 
  @IsPublic()
  @Get(':id')
  async getById(@Param('id') id: string) {
    const data = await this.service.getById(id)
    if (!data) {
      throw new BadRequestException('用户不存在')
    }
    return this.service.buildRO(data)
  }

  @Put(':id')
  async updateInfo(
    @Param('id') id: string,
    @Body() dto: UpdateUserInfoDto,
    @Req() req: Request,
  ) {
    onlySomeAccessible(req, ADMIN_ID, id)
    return this.service.updateInfo(id, dto)
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    onlySomeAccessible(req, ADMIN_ID, id)
    return this.service.delete(id)
  }
}
