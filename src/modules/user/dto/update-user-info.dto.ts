import { IsValidUsername } from 'src/decorators/is-valid-username'

export class UpdateUserInfoDto {
  @IsValidUsername()
  readonly nickname: string = '';

  readonly avatar: string = '';
}
