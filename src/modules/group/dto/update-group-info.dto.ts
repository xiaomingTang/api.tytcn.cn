import { IsValidNickname } from 'src/decorators/is-valid-nickname'

export class UpdateGroupInfoDto {
  @IsValidNickname()
  readonly name: string = '';

  readonly notice: string = '';
}
