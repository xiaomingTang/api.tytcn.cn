import { IsValidNickname } from 'src/decorators/is-valid-nickname'

export class UpdateUserInfoDto {
  @IsValidNickname()
  readonly nickname: string;

  readonly avatar: string;

  readonly description: string;
}
