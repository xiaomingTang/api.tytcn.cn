import { IsNotEmpty } from 'class-validator'
import { AccountType, CodeType } from 'src/constants'

export class CreateAuthCodeDto {
  @IsNotEmpty({
    message: '账号不得为空',
  })
  readonly account: string;

  @IsNotEmpty({
    message: '账号类型不得为空',
  })
  readonly accountType: AccountType;

  @IsNotEmpty({
    message: '验证码类型不得为空',
  })
  readonly codeType: CodeType;
}
