import { IsNotEmpty } from 'class-validator'
import { IsValidNickname } from 'src/decorators/is-valid-nickname'

export class CreateGroupDto {
  @IsValidNickname()
  readonly name: string;

  readonly description?: string;

  @IsNotEmpty({
    message: '群主id不得为空',
  })
  readonly ownerId: string;
}
