import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'

import { LoggerMiddleware } from './middlewares/logger.middleware'
import { UserController } from './modules/user/user.controller'
import { UserModule } from './modules/user/user.module'
import { AuthModule } from './auth/auth.module'
import { CoreModule } from './modules/core.module'
import { GroupModule } from './modules/group/group.module'
import { MessageModule } from './modules/message/message.module'
import { JwtAuthGuard } from './guards/auth.guard'
import { AuthCodeModule } from './modules/auth-code/auth-code.module'
import { RoleModule } from './modules/role/role.module'

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 10,
    }),
    CoreModule,
    RoleModule,
    AuthModule,
    UserModule,
    GroupModule,
    MessageModule,
    AuthCodeModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes(UserController)
  }
}
