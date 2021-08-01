import { IsPhoneNumber } from 'class-validator'
import { IsValidPassword } from 'src/decorators/is-valid-password'
import { IsValidUsername } from 'src/decorators/is-valid-username'

export class CreateUserByPhoneDto {
  @IsValidUsername()
  readonly nickname: string = '';

  @IsPhoneNumber('CN', {
    message: '无效手机号',
  })
  readonly phone: string = '';

  @IsValidPassword()
  readonly password: string = '';

  readonly authCode: string = '';

  readonly avatar: string = '';
}
