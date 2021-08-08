import {
  Body, Controller, Delete, Get, Param, Post,
} from '@nestjs/common'
import { CreateMessageDto } from './dto/create-message.dto'
import { GetMessagesDto } from './dto/get-messages.dto'
import { MessageService } from './message.service'

@Controller('/api/message')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Get('id/:id')
  async getById(@Param('id') id: string) {
    const datas = await this.messageService.getEntities({ key: 'id', value: id, fuzzy: false, relations: ['fromUser', 'toUsers', 'toGroups'] })
    return this.messageService.buildRO(datas[0])
  }

  @Get('list')
  async getList(@Body() dto: GetMessagesDto) {
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
