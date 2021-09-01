import {
  Body, Controller, Delete, Get, Param, Post,
} from '@nestjs/common'
import { formatPages } from 'src/utils/page'
import { CreateMessageDto } from './dto/create-message.dto'
import { MessageService, SearchMessageParams, SearchMessageQueryPipe } from './message.service'

@Controller('/api/message')
export class MessageController {
  constructor(private readonly service: MessageService) {}

  @Post('search')
  async search(@Body(SearchMessageQueryPipe) query: SearchMessageParams) {
    const datas = await this.service.search(query)
    return formatPages(datas, this.service.buildRO.bind(this.service))
  }

  @Post('new')
  async createUser(@Body() dto: CreateMessageDto) {
    return this.service.create(dto)
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const data = await this.service.getById(id, ['fromUser', 'toUsers', 'toGroups'])
    return this.service.buildRO(data)
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.service.delete(id)
  }
}
