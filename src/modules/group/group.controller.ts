import {
  Body, Controller, Delete, Get, Param, Post, Put,
} from '@nestjs/common'
import { CreateGroupDto } from './dto/create-group.dto'
import { UpdateGroupInfoDto } from './dto/update-group-info.dto'
import { GroupService } from './group.service'

@Controller('/api/group')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Get('id/:id')
  async getById(@Param('id') id: string) {
    const datas = await this.groupService.getEntities({ key: 'id', value: id, fuzzy: false, relations: ['owner', 'users'] })
    return datas.map((item) => this.groupService.buildRO(item))[0]
  }

  @Get('name/:name')
  async getByPhone(@Param('name') name: string) {
    const datas = await this.groupService.getEntities({ key: 'name', value: name, fuzzy: false, relations: ['owner', 'users'] })
    return datas.map((item) => this.groupService.buildRO(item))[0]
  }

  @Post('new')
  async createUser(@Body() dto: CreateGroupDto) {
    return this.groupService.create(dto)
  }

  @Put(':id')
  async updateUserInfo(@Param('id') id: string, @Body() dto: UpdateGroupInfoDto) {
    return this.groupService.updateInfo(id, dto)
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.groupService.delete(id)
  }
}
