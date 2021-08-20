import {
  Body, Controller, Delete, Get, Param, Post, Put, Query,
} from '@nestjs/common'
import { CreateGroupDto } from './dto/create-group.dto'
import { UpdateGroupInfoDto } from './dto/update-group-info.dto'
import { GetsByNameParam, GetsByNameQueryPipe, GroupService } from './group.service'

@Controller('/api/group')
export class GroupController {
  constructor(private readonly service: GroupService) {}

  @Get('id/:id')
  async getById(@Param('id') id: string) {
    const data = await this.service.getById(id)
    return this.service.buildRO(data)
  }

  @Get('name/:name')
  async getByPhone(@Query(GetsByNameQueryPipe) query: GetsByNameParam) {
    const datas = await this.service.getsByName(query)
    return datas.map((item) => this.service.buildRO(item))
  }

  @Post('new')
  async createUser(@Body() dto: CreateGroupDto) {
    return this.service.create(dto)
  }

  @Put(':id')
  async updateUserInfo(@Param('id') id: string, @Body() dto: UpdateGroupInfoDto) {
    return this.service.updateInfo(id, dto)
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.service.delete(id)
  }
}
