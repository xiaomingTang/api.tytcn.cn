import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import {
  AuthCodeEntity,
  UserEntity,
} from 'src/entities'
import { AuthCodeService } from '../auth-code/auth-code.service'

import { UserController } from './user.controller'
import { UserService } from './user.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity, AuthCodeEntity,
    ]),
  ],
  providers: [UserService, AuthCodeService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
