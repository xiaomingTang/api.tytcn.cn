import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { JwtService } from '@nestjs/jwt'
import { Between, Like, Repository } from 'typeorm'
import { isEmail, isMobilePhone } from 'class-validator'

import { UserEntity } from 'src/entities'
import { dangerousAssignSome, deleteUndefinedProperties, pick } from 'src/utils/object'
import { CryptoUtil } from 'src/utils/crypto.util'
import { CreateUser } from './dto/create-user.dto'
import { UpdateUserInfoDto } from './dto/update-user-info.dto'
import { SignindDto } from './dto/signin.dto'
import { ADMIN_ID, ADMIN_PHONE, CodeType, CREATE_ADMIN_BY_EMAIL_OBJ, UserOnlineState } from 'src/constants'
import { AuthCodeService } from '../auth-code/auth-code.service'
import { limitPageQuery } from 'src/shared/pipes/page-query.pipe'
import { genePageRes, PageQuery, PageRes } from 'src/utils/page'

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

export type SearchUserParams = PageQuery<
  UserEntity,
  'id' | 'nickname' | 'phone' | 'email' | 'onlineState' | 'createdTime' | 'updatedTime'
> & {
  id?: string;
  nickname?: string;
  phone?: string;
  email?: string;
  onlineState?: UserOnlineState;
  createdTime?: [number, number];
  updatedTime?: [number, number];
  roles?: string[];
}

export const SearchUserQueryPipe = limitPageQuery<UserEntity>({
  orderKeys: ['id', 'nickname', 'phone', 'email', 'onlineState', 'createdTime', 'updatedTime'],
})

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,

    @Inject(CryptoUtil)
    private readonly cryptoUtil: CryptoUtil,

    private readonly authCodeService: AuthCodeService,

    private readonly jwtService: JwtService,
  ) {
    this.initAdminUser()
  }

  async initAdminUser() {
    try {
      if (!await this.getById(ADMIN_ID)) {
        throw new Error('no admin user')
      }
    } catch(err) {
      const { id: adminId } = await this.create(CREATE_ADMIN_BY_EMAIL_OBJ, true)
      await this.userRepo.update({
        id: adminId,
      }, {
        id: ADMIN_ID,
        phone: ADMIN_PHONE,
      })
    }
  }

  async getById(id: string, relations: (keyof UserEntity)[] = ['roles']) {
    const user = await this.userRepo.findOne({
      where: {
        id,
      },
      relations,
    })
    if (!user) {
      throw new BadRequestException('用户不存在')
    }
    return user
  }

  async getByPhone(phone: string, relations: (keyof UserEntity)[] = ['roles']) {
    const user = await this.userRepo.findOne({
      where: {
        phone,
      },
      relations,
    })
    if (!user) {
      throw new BadRequestException('用户不存在')
    }
    return user
  }

  async getByEmail(email: string, relations: (keyof UserEntity)[] = ['roles']) {
    const user = await this.userRepo.findOne({
      where: {
        email,
      },
      relations,
    })
    if (!user) {
      throw new BadRequestException('用户不存在')
    }
    return user
  }

  /**
   * string 空值为 undefined 或 空字符串
   * array 空值为 undefined 或 []
   * 空值 时表示不限
   */
  async search({
    current, pageSize, order,
    id = '', nickname = '', phone = '', email = '', onlineState,
    createdTime, updatedTime, roles,
  }: SearchUserParams, relations: (keyof UserEntity)[] = ['roles']): Promise<PageRes<UserEntity>> {
    return this.userRepo.findAndCount({
      where: deleteUndefinedProperties({
        id: !id ? undefined : Like(`%${id}%`),
        nickname: !nickname ? undefined : Like(`%${nickname}%`),
        phone: !phone ? undefined : Like(`%${phone}%`),
        email: !email ? undefined : Like(`%${email}%`),
        createdTime: !createdTime ? undefined : Between(...createdTime),
        updatedTime: !updatedTime ? undefined : Between(...updatedTime),
        onlineState: !onlineState ? undefined : onlineState,
        // roles: !(roles && roles.length > 0) ? undefined : Raw((alias) => `${'role.name'} @> ARRAY[:...roles]`, { roles }),
        // @TODO: 需要增加 roles 查询
        // roles: !(roles && roles.length > 0) ? undefined : {
        //   name: In(roles),
        // },
      }),
      // join: {
      //   alias: 'role',
      //   innerJoinAndSelect: {
      //     'user': 'user',
      //   }
      // },
      skip: (current - 1) * pageSize,
      take: pageSize,
      order: deleteUndefinedProperties(order),
      relations,
    }).then(([entities, total]) => {
      return genePageRes(entities, {
        data: entities,
        current,
        pageSize,
        total,
      })
    })
  }

  /**
   * @param account 登录账号, 可能是 email 或 phone 或 id
   */
  async signin({ accountType, account, signinType, code }: SignindDto): Promise<UserRO> {
    let user: UserEntity
    const relations: (keyof UserEntity)[] = ['roles']
    if (accountType === 'email' && isEmail(account)) {
      user = await this.getByEmail(account, relations)
    }
    if (accountType === 'phone' && isMobilePhone(account, 'zh-CN')) {
      user = await this.getByPhone(account)
    }
    // 验证码登录
    if (signinType === 'authCode') {
      // 未注册用户自动注册
      if (!user) {
        user = await this.create({
          account,
          accountType,
          authCode: code,
          avatar: '',
          nickname: '',
          password: '',
        })
      } else {
        // 校验验证码
        if (!await this.authCodeService.checkAuthCode({
          account,
          code,
          codeType: CodeType.signin,
        })) {
          throw new BadRequestException('账号或验证码有误: 验证码有误')
        }
      }
    }

    // 密码登录
    if (signinType === 'password') {
      if (!user) {
        throw new BadRequestException('账号或密码有误: 账号不存在')
      }

      if (!this.cryptoUtil.checkPassword(code, user.password)) {
        throw new BadRequestException('账号或密码有误: 密码有误')
      }
    }

    if (!user) {
      // 正常不会执行到这里
      throw new NotFoundException('用户不存在')
    }

    return {
      ...this.buildRO(user),
      token: this.generateJWT(user),
    }
  }

  async create({
    accountType, account, authCode,
    ...dto
  }: CreateUser, ignoreAuth = false): Promise<UserEntity> {
    const curUser = dangerousAssignSome(new UserEntity(), dto, 'avatar', 'nickname', 'password')
    switch (accountType) {
      case 'email':
        if (!isEmail(account)) {
          throw new BadRequestException('不是合法的邮箱')
        }
        if (await this.getByEmail(account)) {
          throw new BadRequestException('账号已存在')
        }
        curUser.email = account
        break
      case 'phone':
        if (!isMobilePhone(account, 'zh-CN')) {
          throw new BadRequestException('不是合法的手机号')
        }
        if (await this.getByPhone(account)) {
          throw new BadRequestException('账号已存在')
        }
        curUser.phone = account
        break
      default:
        throw new BadRequestException(`unknown accountType: ${accountType}`)
    }

    if (!ignoreAuth && !await this.authCodeService.checkAuthCode({
      account,
      code: authCode,
      codeType: CodeType.signin,
    })) {
      throw new BadRequestException('验证码有误')
    }

    return this.userRepo.save(curUser)
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
      // 防止过快的请求被拒绝
      nbf: now - 1,
    })
  }
}
