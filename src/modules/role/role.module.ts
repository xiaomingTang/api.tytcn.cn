import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { AuthCodeEntity, NicknameEntity, RoleEntity } from 'src/entities'
import { AuthCodeService } from '../auth-code/auth-code.service'

import { RoleController } from './role.controller'
import { RoleService } from './role.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RoleEntity, NicknameEntity, AuthCodeEntity,
    ]),
  ],
  providers: [RoleService, AuthCodeService],
  controllers: [RoleController],
  exports: [RoleService],
})
export class RoleModule {}
