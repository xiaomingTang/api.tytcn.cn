import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { AuthCodeEntity, RoleEntity, UserEntity } from 'src/entities'
import { AuthCodeService } from '../auth-code/auth-code.service'
import { UserService } from '../user/user.service'

import { RoleController } from './role.controller'
import { RoleService } from './role.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RoleEntity, UserEntity, AuthCodeEntity,
    ]),
  ],
  providers: [RoleService, UserService, AuthCodeService],
  controllers: [RoleController],
  exports: [RoleService],
})
export class RoleModule {}
