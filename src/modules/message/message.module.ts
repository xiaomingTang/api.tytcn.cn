import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { GroupEntity, MessageEntity, RoleEntity, UserEntity } from 'src/entities'
import { GroupModule } from '../group/group.module'
import { UserModule } from '../user/user.module'

import { MessageController } from './message.controller'
import { MessageService } from './message.service'

@Module({
  imports: [
    UserModule,
    GroupModule,
    TypeOrmModule.forFeature([
      GroupEntity, MessageEntity, RoleEntity, UserEntity,
    ]),
  ],
  providers: [MessageService],
  controllers: [MessageController],
  exports: [MessageService],
})
export class MessageModule {}
