import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { JwtService } from '@nestjs/jwt'
import { Like, Repository } from 'typeorm'
import { isEmail, isMobilePhone } from 'class-validator'

import { RoleEntity, UserEntity } from 'src/entities'
import { dangerousAssignSome, pick } from 'src/utils/object'
import { CryptoUtil } from 'src/utils/crypto.util'
import { CreateUser } from './dto/create-user.dto'
import { UpdateUserInfoDto } from './dto/update-user-info.dto'
import { SignindDto } from './dto/signin.dto'
import { UserOnlineState } from 'src/constants'

export interface UserRO {
  id: string;
  nickname: string;
  avatar: string;
  token: string;
  phone: string;
  email: string;
  onlineState: UserOnlineState;
  friends: UserRO[];
  roles: string[];
  groups: string[];
  ownGroups: string[];
  postedMessages: string[];
  receivedMessages: string[];
}

export const defaultUserRO: UserRO = {
  id: '',
  nickname: '',
  avatar: '',
  token: '',
  phone: '',
  email: '',
  onlineState: UserOnlineState.Off,
  friends: [],
  roles: [],
  groups: [],
  ownGroups: [],
  postedMessages: [],
  receivedMessages: [],
}

interface GetableParams<K extends keyof UserEntity> {
  key: K;
  value: string;
  /**
   * @default false
   */
  fuzzy?: boolean;
  /**
   * @default []
   */
  relations?: (keyof UserEntity)[];
}

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,

    // @Inject(REQUEST) private readonly request: Request,

    @Inject(CryptoUtil) private readonly cryptoUtil: CryptoUtil,

    private readonly jwtService: JwtService,
  ) {
    this.initAdmin()
  }

  async initAdmin() {
    try {
      await this.getEntities({
        key: 'id',
        value: 'admin',
        fuzzy: false,
      })
    } catch(err) {
      const adminId = await this.create({
        avatar: '',
        nickname: 'admin',
        password: 'xiaoming1992',
        authCode: '',
        accountType: 'email',
        account: '1038761793@qq.com',
      })
      await this.userRepo.update({
        id: adminId,
      }, {
        id: 'admin',
        phone: '17620307415',
      })
    }
  }

  async getEntities({
    key,
    value,
    fuzzy = false,
    relations = [],
  }: GetableParams<'id' | 'email' | 'phone' | 'nickname'>): Promise<UserEntity[]> {
    if (!value) {
      throw new BadRequestException(`unknown value: ${value}`)
    }
    const searchableKeys: (keyof UserEntity)[] = ['id', 'email', 'phone', 'nickname']
    if (!searchableKeys.includes(key)) {
      throw new BadRequestException(`unknown key: ${key}`)
    }
    let datas: UserEntity[] = []
    if (fuzzy) {
      datas = await this.userRepo.find({
        where: {
          [key]: Like(`%${value}%`),
        },
        relations,
      })
    } else {
      const res = await this.userRepo.findOne({
        where: {
          [key]: value,
        },
        relations,
      })
      if (!res) {
        throw new BadRequestException('data not exist')
      }
      datas = [res]
    }
    return datas
  }

  /**
   * @param account 登录账号, 可能是 email 或 phone 或 id
   */
  async signin({ accountType, account, signinType, code }: SignindDto): Promise<UserRO> {
    const key: keyof UserEntity = accountType === 'email' ? 'email' : 'phone'
    if (key === 'email' && !isEmail(account)) {
      throw new BadRequestException('邮箱格式有误')
    }
    if (key === 'phone' && !isMobilePhone(account, 'zh-CN')) {
      throw new BadRequestException('手机号格式有误')
    }
    const relations: (keyof UserEntity)[] = ['roles']
    const users = await this.getEntities({
      key,
      value: account,
      fuzzy: false,
      relations,
    }).catch(() => ([])) /* 阻止默认的报错, 下面是用自定义报错 */
    const user = users[0]
    if (signinType === 'authCode') {
      if (!user) {
        throw new BadRequestException('账号或验证码有误: 账号不存在')
      }
  
      // @TODO: 验证码校验逻辑
      if (code.length !== 4) {
        throw new BadRequestException('账号或验证码有误: 验证码有误')
      }
    } else {
      if (!user) {
        throw new BadRequestException('账号或密码有误: 账号不存在')
      }
  
      if (!this.cryptoUtil.checkPassword(code, user.password)) {
        throw new BadRequestException('账号或密码有误: 密码有误')
      }
    }

    return this.buildRO({
      ...user,
      token: this.generateJWT(user),
    })
  }

  async create({
    accountType, account,
    ...dto
  }: CreateUser): Promise<string> {
    // @TODO: 验证 authCode
    const curUser = dangerousAssignSome(new UserEntity(), dto, 'avatar', 'nickname', 'password')
    switch (accountType) {
      case 'email':
        if (!isEmail(account)) {
          throw new BadRequestException('不是合法的邮箱')
        }
        curUser.email = account
        break
      case 'phone':
        if (!isMobilePhone(account, 'zh-CN')) {
          throw new BadRequestException('不是合法的手机号')
        }
        curUser.phone = account
        break
      default:
        throw new BadRequestException(`unknown accountType: ${accountType}`)
    }

    try {
      if (await this.getEntities({
        key: accountType,
        value: account,
      })) {
        throw new Error('账号已存在')
      }
    } catch (error) {
      // pass
    }

    const savedUser = await this.userRepo.save(curUser)
    return savedUser.id
  }

  async updateInfo(id: string, dto: UpdateUserInfoDto): Promise<boolean> {
    await this.userRepo.update({
      id,
    }, pick(dto, ['avatar', 'nickname']))

    return true
  }

  async delete(id: string): Promise<boolean> {
    await this.userRepo.delete({
      id,
    })

    return true
  }

  /**
   * 作为其他对象的属性, 无需一些复杂的数组属性时, 使用该方法
   */
  exportAsItem(user: UserEntity): UserRO {
    return {
      ...defaultUserRO,
      ...pick(user, ['id', 'nickname', 'phone', 'email', 'avatar']),
    }
  }

  public buildRO(user: UserEntity): UserRO {
    const filteredUser: UserRO = {
      ...defaultUserRO,
      ...pick(user, ['id', 'nickname', 'phone', 'email', 'avatar']),
      roles: (user.roles ?? []).map((item) => item.name),
      friends: (user.friends ?? []).map((item) => this.exportAsItem(item)),
      groups: (user.groups ?? []).map((item) => item.name),
      ownGroups: (user.ownGroups ?? []).map((item) => item.name),
      postedMessages: (user.postedMessages ?? []).map((item) => item.content),
      receivedMessages: (user.receivedMessages ?? []).map((item) => item.content),
    }

    return filteredUser
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
}
