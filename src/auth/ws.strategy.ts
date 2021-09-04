import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { JWT_SECRET } from 'src/constants'
import { UserEntity } from 'src/entities'
import { UserRO } from 'src/modules/user/user.service'
import { AuthService } from './auth.service'

@Injectable()
export class WsStrategy extends PassportStrategy(Strategy, 'ws') {
  constructor(
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => {
          // 这儿无从获取 token...
          return 'jwt token'
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: JWT_SECRET,
    })
  }

  async validate(payload: UserRO): Promise<UserEntity | null> {
    // 此处 返回值 将会被注入到 request.user 属性上
    return this.authService.validateUser(payload.id)
  }
}
