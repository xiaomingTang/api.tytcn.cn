import { IsEmail } from 'class-validator'
import { IsValidPassword } from 'src/decorators/is-valid-password'
import { IsValidUsername } from 'src/decorators/is-valid-username'

export class CreateUserByEmailDto {
  @IsValidUsername()
  readonly nickname: string = '';

  @IsEmail({}, {
    message: '邮箱格式有误',
  })
  readonly email: string = '';

  @IsValidPassword()
  readonly password: string = '';

  readonly authCode: string = '';

  readonly avatar: string = '';
}
