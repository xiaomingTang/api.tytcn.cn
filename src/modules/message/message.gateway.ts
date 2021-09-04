import { InjectRepository } from '@nestjs/typeorm'
import {
  ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer,
} from '@nestjs/websockets'
import { Repository } from 'typeorm'
import WebSocket from 'ws'
import * as jwt from 'jsonwebtoken'

import { GroupEntity, MessageEntity, UserEntity } from 'src/entities'
import { HttpStatus, Injectable, UseFilters, UseInterceptors } from '@nestjs/common'
import { TransformResponseInterceptor } from 'src/interceptors/transform-response.interceptor'
import { WsExceptionFilter } from 'src/filters/ws-exception.filter'
import { UserRO } from '../user/user.service'
import { IncomingMessage } from 'http'
import { JWT_SECRET } from 'src/constants'

// @UseGuards(WsGuard)
@UseFilters(WsExceptionFilter)
@UseInterceptors(TransformResponseInterceptor)
@WebSocketGateway(3001)
@Injectable()
export class MessageGateway
implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    @InjectRepository(UserEntity) private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(GroupEntity) private readonly groupRepo: Repository<GroupEntity>,
    @InjectRepository(MessageEntity) private readonly messageRepo: Repository<MessageEntity>,
  ) {
    console.log('init')
  }

  @WebSocketServer()
  server: WebSocket

  user: UserEntity | undefined

  afterInit() {
    console.log('Gateway initialized')
  }

  // socket连接钩子
  async handleConnection(
    @ConnectedSocket() client: WebSocket,
    @MessageBody() data: IncomingMessage,
  ) {
    try {
      const authorization = new URL(decodeURI(data.url ?? ''), 'https://whatever.com/').searchParams.get('Authorization') ?? ''
      const { id } = jwt.verify(authorization.split(' ')[1], JWT_SECRET, {
        ignoreExpiration: false,
      }) as UserRO
      this.user = await this.userRepo.findOne({
        where: {
          id,
        },
        relations: ['roles', 'groups'],
      })
      if (!this.user) {
        throw new Error('用户不存在')
      }
    } catch (error) {
      console.log(error.message)
      client.send(JSON.stringify({
        data: null,
        success: false,
        status: HttpStatus.UNAUTHORIZED,
        message: '请登录后连接',
      }))
      client.close()
    }
  }

  // socket断连钩子
  async handleDisconnect() {
    console.log('连接关闭')
  }

  @SubscribeMessage('chat-list-2')
  async getChatList2(
    @MessageBody() data: string,
    @ConnectedSocket() client: WebSocket,
  ) {
    console.log('nickname: ', this.user?.nickname)
    return 'hello from server-2'
  }

  @SubscribeMessage('chat-list')
  async getChatList(
    @MessageBody() data: string,
    @ConnectedSocket() client: WebSocket,
  ) {
    return 'hello from server'
  }
}
