import { IsValidNickname } from 'src/decorators/is-valid-nickname'
import { IsValidPassword } from 'src/decorators/is-valid-password'

export class CreateUser {
  readonly avatar: string = '';

  @IsValidNickname()
  readonly nickname: string = '';

  @IsValidPassword()
  readonly password: string = '';

  readonly authCode: string = '';

  readonly accountType: 'phone' | 'email' = 'phone';

  readonly account: string = '';
}
