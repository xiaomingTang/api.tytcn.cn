import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { GroupEntity, MessageEntity, RoleEntity, UserEntity } from 'src/entities'
import { UserModule } from '../user/user.module'

import { GroupController } from './group.controller'
import { GroupService } from './group.service'

@Module({
  imports: [
    UserModule,
    TypeOrmModule.forFeature([
      GroupEntity, MessageEntity, RoleEntity, UserEntity,
    ]),
  ],
  providers: [GroupService],
  controllers: [GroupController],
  exports: [GroupService],
})
export class GroupModule {}
