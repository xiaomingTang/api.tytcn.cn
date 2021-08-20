import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { AuthCodeEntity } from 'src/entities'

import { AuthCodeController } from './auth-code.controller'
import { AuthCodeService } from './auth-code.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AuthCodeEntity,
    ]),
  ],
  providers: [AuthCodeService],
  controllers: [AuthCodeController],
  exports: [AuthCodeService],
})
export class AuthCodeModule {}
