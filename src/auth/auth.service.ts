import { Injectable } from '@nestjs/common'
import { UserEntity } from 'src/entities'
import { UserService } from 'src/modules/user/user.service'

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UserService,
  ) {}

  async validateUser(id: string): Promise<UserEntity> {
    return this.usersService.getEntityById({ id, relations: ['roles'] })
  }
}
