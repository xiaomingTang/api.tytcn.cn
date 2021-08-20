import {
  Body, Controller, Delete, Get, Param, Post, Query,
} from '@nestjs/common'
import { CreateMessageDto } from './dto/create-message.dto'
import { GetMessagesDto } from './dto/get-messages.dto'
import { MessageService } from './message.service'

@Controller('/api/message')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Get('id/:id')
  async getById(@Param('id') id: string) {
    const data = await this.messageService.getById(id, ['fromUser', 'toUsers', 'toGroups'])
    return this.messageService.buildRO(data)
  }

  @Get('list')
  async getList(@Query() dto: GetMessagesDto) {
    const datas = await this.messageService.getsByFuzzySearch(dto)
    return datas.map((item) => this.messageService.buildRO(item))
  }

  @Post('new')
  async createUser(@Body() dto: CreateMessageDto) {
    return this.messageService.create(dto)
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.messageService.delete(id)
  }
}
