import { IsNotEmpty } from 'class-validator'
import { IsValidNickname } from 'src/decorators/is-valid-nickname'
import { IsValidPassword } from 'src/decorators/is-valid-password'

export class CreateUser {
  readonly avatar: string = '';

  @IsValidNickname()
  readonly nickname: string = '';

  @IsValidPassword()
  readonly password: string = '';

  @IsNotEmpty({
    message: '验证码不得为空',
  })
  readonly authCode: string = '';

  @IsNotEmpty({
    message: '账号类型不得为空',
  })
  readonly accountType: 'phone' | 'email' = 'phone';

  @IsNotEmpty({
    message: '账号不得为空',
  })
  readonly account: string = '';
}
