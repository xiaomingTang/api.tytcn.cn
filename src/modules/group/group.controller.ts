import {
  Body, Controller, Delete, Get, Param, Post, Put, Req,
} from '@nestjs/common'
import { Request } from 'express'
import { ADMIN_ID } from 'src/constants'
import { IsPublic } from 'src/decorators/guard.decorator'
import { onlySomeAccessible } from 'src/utils/auth'
import { formatPages } from 'src/utils/page'
import { CreateGroupDto } from './dto/create-group.dto'
import { UpdateGroupInfoDto } from './dto/update-group-info.dto'
import { GroupService, SearchGroupParams, SearchGroupQueryPipe } from './group.service'

@Controller('/api/group')
export class GroupController {
  constructor(private readonly service: GroupService) {}

  @Post('search')
  async search(@Body(SearchGroupQueryPipe) query: SearchGroupParams) {
    const datas = await this.service.search(query)
    return formatPages(datas, this.service.buildRO.bind(this.service))
  }

  @Post('new')
  async createGroup(
    @Body() dto: CreateGroupDto,
    @Req() req: Request,
  ) {
    onlySomeAccessible(req, ADMIN_ID, dto.ownerId)
    return this.service.create(dto)
  }

  /**
   * 当前热门用户
   */
  @IsPublic()
  @Get('hot')
  async getHotGroups() {
    const datas = await this.service.getHotGroups()
    return formatPages(datas, this.service.buildRO.bind(this.service))
  }
  
  @Get(':id')
  async getById(@Param('id') id: string) {
    const data = await this.service.getById(id)
    return this.service.buildRO(data)
  }

  @Put(':id')
  async updateUserInfo(
    @Param('id') id: string,
    @Body() dto: UpdateGroupInfoDto,
    @Req() req: Request
  ) {
    const group = await this.service.getById(id, ['owner'])
    onlySomeAccessible(req, ADMIN_ID, group.owner?.id)
    return this.service.updateInfo(id, dto)
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @Req() req: Request
  ) {
    const group = await this.service.getById(id, ['owner'])
    onlySomeAccessible(req, ADMIN_ID, group.owner?.id)
    return this.service.delete(id)
  }
}
