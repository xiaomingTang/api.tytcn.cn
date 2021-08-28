import {
  Body, Controller, Delete, Get, Param, Post, Put,
} from '@nestjs/common'
import { formatPages } from 'src/utils/page'
import { CreateGroupDto } from './dto/create-group.dto'
import { UpdateGroupInfoDto } from './dto/update-group-info.dto'
import { GroupService, SearchGroupParams, SearchGroupQueryPipe } from './group.service'

@Controller('/api/group')
export class GroupController {
  constructor(private readonly service: GroupService) {}

  @Get('search')
  async search(@Body(SearchGroupQueryPipe) query: SearchGroupParams) {
    const datas = await this.service.search(query)
    return formatPages(datas, this.service.buildRO.bind(this.service))
  }

  @Post('new')
  async createUser(@Body() dto: CreateGroupDto) {
    return this.service.create(dto)
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const data = await this.service.getById(id)
    return this.service.buildRO(data)
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
