import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { JwtService } from '@nestjs/jwt'
import { Like, Repository } from 'typeorm'
import { isEmail, isMobilePhone } from 'class-validator'

import { UserEntity } from 'src/entities'
import { dangerousAssignSome, pick } from 'src/utils/object'
import { CryptoUtil } from 'src/utils/crypto.util'
import { CreateUser } from './dto/create-user.dto'
import { UpdateUserInfoDto } from './dto/update-user-info.dto'
import { SignindDto } from './dto/signin.dto'
import { PageQuery, UserOnlineState } from 'src/constants'
import { AuthCodeService } from '../auth-code/auth-code.service'
import { limitPageQuery } from 'src/shared/pipes/page-query.pipe'

export type GetsByNicknameParam = PageQuery<UserEntity, 'nickname' | 'updatedTime' | 'createdTime' | 'id'> & {
  nickname: string;
}

export const GetsByNicknameQueryPipe = limitPageQuery<UserEntity>({
  orderKeys: ['nickname', 'updatedTime', 'createdTime', 'id'],
})

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

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,

    private readonly authCodeService: AuthCodeService,

    @Inject(CryptoUtil) private readonly cryptoUtil: CryptoUtil,

    private readonly jwtService: JwtService,
  ) {
    this.initAdmin()
  }

  async initAdmin() {
    try {
      await this.getById('admin')
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

  async getById(id: string, relations: (keyof UserEntity)[] = ['roles']) {
    return this.userRepo.findOne({
      where: {
        id,
      },
      relations,
    })
  }

  async getByPhone(phone: string, relations: (keyof UserEntity)[] = ['roles']) {
    return this.userRepo.findOne({
      where: {
        phone,
      },
      relations,
    })
  }

  async getByEmail(email: string, relations: (keyof UserEntity)[] = ['roles']) {
    return this.userRepo.findOne({
      where: {
        email,
      },
      relations,
    })
  }

  async getsByNickname({
    page, size, order, nickname,
  }: GetsByNicknameParam) {
    return this.userRepo.find({
      where: {
        nickname: Like(`%${nickname}%`),
      },
      skip: (page - 1) * size,
      take: size,
      order,
      relations: ['owner'],
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
        const newUserId = await this.create({
          account,
          accountType,
          authCode: code,
          avatar: '',
          nickname: '',
          password: '',
        })
        user = await this.getById(newUserId)
      } else {
        // 校验验证码
        if (!await this.authCodeService.checkAuthCode({
          account,
          code,
          codeType: 'signin',
        })) {
          throw new BadRequestException('账号或验证码有误: 验证码有误')
        }
      }
    }
    // 密码登录
    if (signinType === 'passport') {
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
  }: CreateUser): Promise<string> {
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

    if (!await this.authCodeService.checkAuthCode({
      account,
      code: authCode,
      codeType: 'signin',
    })) {
      throw new BadRequestException('验证码有误')
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
      // 防止过快的请求被拒绝
      nbf: now - 1,
    })
  }
}
