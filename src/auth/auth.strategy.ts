import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { JWT_SECRET } from 'src/constants'
import { UserEntity } from 'src/entities'
import { UserRO } from 'src/modules/user/user.service'
import { AuthService } from './auth.service'

@Injectable()
export class AuthStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: JWT_SECRET,
    })
  }

  async validate(payload: UserRO): Promise<UserEntity | null> {
    // 此处 返回值 将会被注入到 request.user 属性上
    return this.authService.validateUser(payload.id)
  }
}
