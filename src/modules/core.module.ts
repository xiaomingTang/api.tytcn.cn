import { Global, Module } from '@nestjs/common'
import { PassportModule } from '@nestjs/passport'
import { JwtModule } from '@nestjs/jwt'
import { TypeOrmModule } from '@nestjs/typeorm'
import { JWT_EXPIRES_IN, JWT_SECRET, TypeOrmConfig } from 'src/constants'
import { CryptoUtil } from 'src/utils/crypto.util'

@Global()
@Module({
  imports: [
    TypeOrmModule.forRoot(TypeOrmConfig),
    PassportModule.register({
      defaultStrategy: 'jwt',
      property: 'user',
      session: false,
    }),
    JwtModule.register({
      secret: JWT_SECRET,
      signOptions: {
        expiresIn: JWT_EXPIRES_IN,
      },
    }),
  ],
  providers: [CryptoUtil],
  exports: [PassportModule, JwtModule, CryptoUtil],
})
export class CoreModule {}
