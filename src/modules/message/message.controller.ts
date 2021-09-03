import {
  Body, Controller, ForbiddenException, Get, Param, Post, Req,
} from '@nestjs/common'
import { ADMIN_ID } from 'src/constants'
import { isAdmin, onlySomeAccessible } from 'src/utils/auth'
import { formatPages } from 'src/utils/page'
import { RequestWithUser, UserService } from '../user/user.service'
import { CreateMessageDto } from './dto/create-message.dto'
import { GetMessageListParams, GetMessageListQueryPipe, MessageService, SearchMessageParams, SearchMessageQueryPipe } from './message.service'

@Controller('/api/message')
export class MessageController {
  constructor(
    private readonly service: MessageService,
    private readonly userService: UserService,
  ) {}

  @Post('search')
  async search(
    @Body(SearchMessageQueryPipe) query: SearchMessageParams,
    @Req() req: RequestWithUser,
  ) {
    const { fromUserId, toUserId, toGroupId } = query
    const requestUserId = req.user?.id
    if (!isAdmin(req)) {
      if (fromUserId !== requestUserId) {
        if (!toUserId && !toGroupId) {
          throw new ForbiddenException('你无权查看他人信息')
        }
        if (toUserId && toUserId !== requestUserId) {
          throw new ForbiddenException('你无权查看他人信息')
        }
        if (toGroupId && !await this.userService.isInGroup({ userId: requestUserId, groupId: toGroupId })) {
          throw new ForbiddenException('你不是群成员, 无法查看群消息')
        }
      }
    }
    const datas = await this.service.search(query)
    return formatPages(datas, this.service.buildRO.bind(this.service))
  }

  @Post('list-between')
  async getMessageList(
    @Body(GetMessageListQueryPipe) query: GetMessageListParams,
    @Req() req: RequestWithUser,
  ) {
    onlySomeAccessible(req, ADMIN_ID, query.masterId)
    const datas = await this.service.getMessageList(query)
    return formatPages(datas, this.service.buildRO.bind(this.service))
  }

  @Get('chat-list/:userId')
  async getChatList(
    @Param('userId') userId: string,
    @Req() req: RequestWithUser,
  ) {
    onlySomeAccessible(req, ADMIN_ID, userId)
    const datas = await this.service.getChatList(userId)
    return datas.map((item) => this.service.buildRO(item))
  }

  @Post('new')
  async createUser(@Body() dto: CreateMessageDto) {
    return this.service.create(dto)
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const data = await this.service.getById(id, ['fromUser', 'toUser', 'toGroup'])
    return this.service.buildRO(data)
  }
}
