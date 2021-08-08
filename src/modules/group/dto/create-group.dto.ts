import { IsValidNickname } from 'src/decorators/is-valid-nickname'

export class CreateGroupDto {
  @IsValidNickname()
  readonly name: string = '';

  readonly notice: string = '';

  readonly ownerId: string = '';
}
