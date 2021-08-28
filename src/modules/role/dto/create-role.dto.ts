import { IsNotEmpty } from 'class-validator'

export class CreateRoleDto {
  @IsNotEmpty({
    message: '角色名不得为空',
  })
  readonly name: string;

  readonly description?: string;
}
