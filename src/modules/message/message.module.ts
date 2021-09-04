import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthService } from 'src/auth/auth.service'
import { WsStrategy } from 'src/auth/ws.strategy'

import { GroupEntity, MessageEntity, RoleEntity, UserEntity } from 'src/entities'
import { GroupModule } from '../group/group.module'
import { UserModule } from '../user/user.module'

import { MessageController } from './message.controller'
import { MessageGateway } from './message.gateway'
import { MessageService } from './message.service'

@Module({
  imports: [
    UserModule,
    GroupModule,
    TypeOrmModule.forFeature([
      GroupEntity, MessageEntity, RoleEntity, UserEntity,
    ]),
  ],
  providers: [MessageService, MessageGateway, AuthService, WsStrategy],
  controllers: [MessageController],
  exports: [MessageService],
})
export class MessageModule {}
