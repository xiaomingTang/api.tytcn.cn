import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { JwtService } from '@nestjs/jwt'
import { Like, Repository } from 'typeorm'
import { isEmail, isPhoneNumber } from 'class-validator'

import { UserEntity } from 'src/entities'
import { dangerousAssignSome, pick } from 'src/utils/object'
import { CryptoUtil } from 'src/utils/crypto.util'
import { CreateUserByEmailDto } from './dto/create-user-by-email.dto'
import { CreateUserByPhoneDto } from './dto/create-user-by-phone.dto'
import { UpdateUserInfoDto } from './dto/update-user-info.dto'
import { SigninWithPasswordDto } from './dto/signin.dto'

export interface UserRO {
  id: string;
  phone: string;
  nickname: string;
  email: string;
  avatar: string;
  token: string;
}

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,

    // @Inject(REQUEST) private readonly request: Request,

    @Inject(CryptoUtil) private readonly cryptoUtil: CryptoUtil,

    private readonly jwtService: JwtService,
  ) {}

  async getUniqueUser({ type, value }: {
    type: 'id' | 'email' | 'phone';
    value: string;
  }) {
    switch (type) {
      case 'email': {
        const user = await this.getEntityByEmail({ email: value })
        return this.buildUserRO(user, { withToken: false })
      }
      case 'phone': {
        const user = await this.getEntityByPhone({ phone: value })
        return this.buildUserRO(user, { withToken: false })
      }
      default: {
        const user = await this.getEntityById({ id: value })
        return this.buildUserRO(user, { withToken: false })
      }
    }
  }

  async getUsers({ type, value }: {
    type: 'nickname';
    value: string;
  }) {
    if (type !== 'nickname') {
      throw new BadRequestException(`unknown type: ${type}`)
    }
    const users = await this.getEntitiesByNickname({ nickname: value })
    return users.map((user) => this.buildUserRO(user, { withToken: false }))
  }

  async getEntityById({
    id, relations = [],
  }: {
    id: string;
    relations?: (keyof UserEntity)[];
  }): Promise<UserEntity> {
    if (!id) {
      throw new BadRequestException('id 为空')
    }
    const data = await this.userRepo.findOne({
      where: {
        id,
      },
      relations,
    })
    if (!data) {
      throw new BadRequestException('用户不存在')
    }
    return data
  }

  async getEntityByEmail({
    email, relations = [],
  }: {
    email: string;
    relations?: (keyof UserEntity)[];
  }): Promise<UserEntity> {
    if (!email) {
      throw new BadRequestException('邮箱 为空')
    }
    const data = await this.userRepo.findOne({
      where: {
        email,
      },
      relations,
    })
    if (!data) {
      throw new BadRequestException('用户不存在')
    }
    return data
  }

  async getEntityByPhone({
    phone, relations = [],
  }: {
    phone: string;
    relations?: (keyof UserEntity)[];
  }): Promise<UserEntity> {
    if (!phone) {
      throw new BadRequestException('手机号 为空')
    }
    const data = await this.userRepo.findOne({
      where: {
        phone,
      },
      relations,
    })
    if (!data) {
      throw new BadRequestException('用户不存在')
    }
    return data
  }

  async getEntitiesByNickname({
    nickname, relations = [],
  }: {
    nickname: string;
    relations?: (keyof UserEntity)[];
  }): Promise<UserEntity[]> {
    if (!nickname) {
      throw new BadRequestException('用户昵称为空')
    }
    const users = await this.userRepo.find({
      where: {
        nickname: Like(`%${nickname}%`),
      },
      relations,
    })
    return users
  }

  /**
   * @param account 登录账号, 可能是 email 或 phone
   */
  async signinWithPassword({ account, password }: SigninWithPasswordDto): Promise<UserRO> {
    let user: UserEntity
    if (isEmail(account)) {
      user = await this.getEntityByEmail({ email: account })
    } else if (isPhoneNumber(account)) {
      user = await this.getEntityByPhone({ phone: account })
    } else {
      user = await this.getEntityById({ id: account })
    }
    if (!user) {
      throw new BadRequestException('账号不存在')
    }

    if (!this.cryptoUtil.checkPassword(password, user.password)) {
      throw new BadRequestException('登录密码有误')
    }

    return this.buildUserRO(user, { withToken: true })
  }

  async createByEmail(dto: CreateUserByEmailDto): Promise<string> {
    // @TODO: 验证 authCode
    const newUser = dangerousAssignSome(new UserEntity(), dto, 'avatar', 'email', 'nickname', 'password')

    try {
      const savedUser = await this.userRepo.save(newUser)
      return savedUser.id
    } catch (error) {
      throw new BadRequestException(`注册失败, ${error.message}`)
    }
  }

  async createByPhone(dto: CreateUserByPhoneDto): Promise<string> {
    // @TODO: 验证 authCode
    const newUser = dangerousAssignSome(new UserEntity(), dto, 'avatar', 'phone', 'nickname', 'password')

    try {
      const savedUser = await this.userRepo.save(newUser)
      return savedUser.id
    } catch (error) {
      throw new BadRequestException(`注册失败, ${error.message}`)
    }
  }

  async updateUserInfo(id: string, dto: UpdateUserInfoDto): Promise<boolean> {
    await this.userRepo.update({
      id,
    }, pick(dto, 'avatar', 'nickname'))

    return true
  }

  async delete(id: string): Promise<boolean> {
    await this.userRepo.delete({
      id,
    })

    return true
  }

  public generateJWT(user: UserEntity) {
    // jwt 计算时间是秒, 而非毫秒, 所以除以 1000
    const now = Date.now() / 1000

    return this.jwtService.sign({
      id: user.id,
      name: user.nickname,
      email: user.email,
      iat: now,
      nbf: now,
    })
  }

  public buildUserRO(user: UserEntity, {
    withToken,
  }: {
    withToken: boolean;
  }): UserRO {
    return {
      id: user.id,
      nickname: user.nickname,
      phone: user.phone,
      email: user.email,
      avatar: user.avatar,
      token: withToken ? this.generateJWT(user) : '',
    }
  }
}
