import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { UserEntity } from 'src/entities'
import { Repository } from 'typeorm'

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async validateUser(id: string): Promise<UserEntity> {
    const user = await this.userRepo.findOne({
      where: {
        id,
      },
      // relations 必须带上 roles, 因为 roles 在 roles.guard.ts 中使用到了
      // relations 必须带上 groups, 因为 groups 在 很多地方使用到了
      relations: ['roles', 'groups'],
    })
    return user
  }
}
