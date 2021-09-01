import {
  Body, Controller, Post, Req,
} from '@nestjs/common'
import { Roles } from 'src/decorators/guard.decorator'
import { RoleService, SearchRoleParams, SearchRoleQueryPipe } from './role.service'
import { CreateRoleDto } from './dto/create-role.dto'
import { formatPages } from 'src/utils/page'
import { Request } from 'express'
import { onlySomeAccessible } from 'src/utils/auth'
import { ADMIN_ID } from 'src/constants'

@Controller('/api/role')
export class RoleController {
  constructor(private readonly service: RoleService) {}

  @Post('search')
  async search(@Body(SearchRoleQueryPipe) query: SearchRoleParams) {
    const datas = await this.service.search(query)
    return formatPages(datas, this.service.buildRO.bind(this.service))
  }

  @Roles('admin')
  @Post('new')
  async createRole(
    @Body() dto: CreateRoleDto,
    @Req() req: Request,
  ) {
    onlySomeAccessible(req, ADMIN_ID)
    const data = await this.service.create(dto)
    return this.service.buildRO(data)
  }
}
