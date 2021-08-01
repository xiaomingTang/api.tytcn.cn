import { Module } from '@nestjs/common'
import { UserModule } from 'src/modules/user/user.module'
import { AuthService } from './auth.service'
import { AuthStrategy } from './auth.strategy'

@Module({
  imports: [UserModule],
  providers: [AuthService, AuthStrategy],
  exports: [AuthService],
})
export class AuthModule {}
