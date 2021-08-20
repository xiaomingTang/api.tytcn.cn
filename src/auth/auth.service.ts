import { Injectable } from '@nestjs/common'
import { UserEntity } from 'src/entities'
import { UserService } from 'src/modules/user/user.service'

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UserService,
  ) {}

  async validateUser(id: string): Promise<UserEntity> {
    // relations 必须带上 roles, 因为 roles 在 roles.guard.ts 中使用到了
    const data = await this.usersService.getById(id)
    return data
  }
}
