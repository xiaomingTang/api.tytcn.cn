import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserEntity } from 'src/entities'
import { AuthService } from './auth.service'
import { AuthStrategy } from './auth.strategy'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
    ]),
  ],
  providers: [AuthService, AuthStrategy],
  exports: [AuthService],
})
export class AuthModule {}
