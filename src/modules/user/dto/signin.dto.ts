import { IsNotEmpty } from 'class-validator'
import { AccountType, SigninType } from 'src/constants'

export class SignindDto {
  @IsNotEmpty({
    message: '账号类型不得为空',
  })
  readonly accountType: AccountType;

  @IsNotEmpty({
    message: '登录类型不得为空',
  })
  readonly signinType: SigninType;

  @IsNotEmpty({
    message: '账号不得为空',
  })
  /**
   * 登录账号, 可能是 email / phone
   */
  readonly account: string;

  @IsNotEmpty({
    message: '密码或验证码不得为空',
  })
  /**
   * password or authCode
   */
  readonly code: string;
}
