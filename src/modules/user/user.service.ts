import { BadRequestException, Inject, Injectable, Scope } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { JwtService } from '@nestjs/jwt'
import { Between, Like, Raw, Repository } from 'typeorm'
import { isEmail, isMobilePhone } from 'class-validator'

import { UserEntity, NicknameEntity, RoleEntity } from 'src/entities'
import { dangerousAssignSome, deleteUndefinedProperties, geneNewEntity, pick } from 'src/utils/object'
import { CryptoUtil } from 'src/utils/crypto.util'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserInfoDto } from './dto/update-user-info.dto'
import { SignindDto } from './dto/signin.dto'
import { ADMIN_ID, ADMIN_ROLE_NAME, CodeType, CREATE_ADMIN_DTO } from 'src/constants'
import { AuthCodeService } from '../auth-code/auth-code.service'
import { limitPageQuery } from 'src/shared/pipes/page-query.pipe'
import { genePageResPipe, PageQuery, PageRes } from 'src/utils/page'
import { REQUEST } from '@nestjs/core'
import { Request } from 'express'
import { getRandomAvatar, getRandomNickname } from './utils'

export interface RequestWithUser extends Request {
  user?: UserEntity;
}

export interface UserRO {
  id: string;
  nickname: string;
  avatar: string;
  description: string;
  token: string;
  phone: string;
  email: string;
  friends: UserRO[];
  roles: string[];
  groups: string[];
}

export const defaultUserRO: UserRO = {
  id: '',
  nickname: '',
  avatar: '',
  description: '',
  token: '',
  phone: '',
  email: '',
  friends: [],
  roles: [],
  groups: [],
}

export type SearchUserParams = PageQuery<
  UserEntity,
  'id' | 'nickname' | 'phone' | 'email' | 'createdTime' | 'updatedTime'
> & {
  id?: string;
  nickname?: string;
  phone?: string;
  email?: string;
  createdTime?: [number, number];
  updatedTime?: [number, number];
  roles?: string[];
}

export const SearchUserQueryPipe = limitPageQuery<UserEntity>({
  orderKeys: ['id', 'nickname', 'phone', 'email', 'createdTime', 'updatedTime'],
})

@Injectable({ scope: Scope.REQUEST })
export class UserService {
  constructor(
    @InjectRepository(UserEntity) private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(NicknameEntity) private readonly nicknameRepo: Repository<NicknameEntity>,

    @Inject(REQUEST) private readonly request: RequestWithUser,

    @Inject(CryptoUtil) private readonly cryptoUtil: CryptoUtil,

    private readonly authCodeService: AuthCodeService,
    private readonly jwtService: JwtService,
  ) {
    this.initAdminUser()
  }

  /**
   * ????????? constructor ????????? admin ??????
   * ?????? private, ??????????????????
   */
  private async initAdminUser() {
    const user = await this.userRepo.findOne({
      where: {
        id: ADMIN_ID,
      },
    })
    if (!user) {
      const adminRole = new RoleEntity()
      const newUser = dangerousAssignSome(new UserEntity(), {
        ...CREATE_ADMIN_DTO,
        roles: [
          adminRole,
        ],
      }, 'avatar', 'nickname', 'password', 'email', 'phone', 'roles')
      adminRole.name = ADMIN_ROLE_NAME
      adminRole.description = '?????????'
      adminRole.createdBy = newUser

      try {
        const savedUser = await this.userRepo.save(newUser)
        await this.userRepo.update({
          id: savedUser.id,
        }, geneNewEntity(UserEntity, {
          id: ADMIN_ID,
        }))
      } catch (error) {
        // pass
      }
    }
  }

  async getById(id: string, relations: (keyof UserEntity)[] = ['roles']) {
    const user = await this.userRepo.findOne({
      where: {
        id,
      },
      relations,
    })
    return user
  }

  async getByPhone(phone: string, relations: (keyof UserEntity)[] = ['roles']) {
    const user = await this.userRepo.findOne({
      where: {
        phone,
      },
      relations,
    })
    return user
  }

  async getByEmail(email: string, relations: (keyof UserEntity)[] = ['roles']) {
    const user = await this.userRepo.findOne({
      where: {
        email,
      },
      relations,
    })
    return user
  }

  async getHotUsers(): Promise<PageRes<UserEntity>> {
    // const selfId = this.request.user?.id ?? ''
    const now = new Date()
    // @TODO: ???????????????????????? 100min, ???????????????????????? 10min ??? 5min
    // (100min)???????????????
    const timeBefore = new Date(now.getTime() - 1000 * 60 * 100)
    // +1s, ??????????????????????????? user
    const timeAfter = new Date(now.getTime() + 1000)
    return this.userRepo.findAndCount({
      where: {
        // @TODO: ?????????????????????????????? selfId, ?????????????????????????????????????????????
        // id: Not(selfId),
        updatedTime: Between(timeBefore, timeAfter),
      },
      order: {
        updatedTime: 'DESC',
      },
      // ?????? 10 ???
      take: 10,
    }).then(genePageResPipe({ current: 1, pageSize: 10 }))
  }

  async isInGroup({ userId, groupId }: {
    userId: string;
    groupId: string;
  }) {
    const user = await this.getById(userId, ['groups'])
    return !!user?.groups.find((item) => item.id === groupId)
  }

  async isFriends(userIdA: string, userIdB: string) {
    const user = await this.getById(userIdA, ['friends'])
    return !!user?.friends.find((item) => item.id === userIdB)
  }

  /**
   * string ????????? undefined ??? ????????????
   * array ????????? undefined ??? []
   * ?????? ???????????????
   */
  async search({
    current, pageSize, order,
    id = '', nickname = '', phone = '', email = '',
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
        roles: !(roles && roles.length > 0) ? undefined : Raw((alias) => `${alias} @> ARRAY[:...roles]`, { roles }),
        // @TODO: ???????????? roles ??????
        // roles: !(roles && roles.length > 0) ? undefined : {
        //   name: In(roles),
        // },
      }),
      join: {
        alias: 'user',
        innerJoin: {
          'roles': 'user.roles',
        }
      },
      skip: (current - 1) * pageSize,
      take: pageSize,
      order: deleteUndefinedProperties(order),
      relations,
    }).then(genePageResPipe({ current, pageSize }))
  }

  /**
   * @param account ????????????, ????????? email ??? phone ??? id
   */
  async signin({ accountType, account, signinType, code }: SignindDto): Promise<UserRO> {
    let user: UserEntity
    if (accountType === 'email' && isEmail(account)) {
      user = await this.getByEmail(account, ['roles'])
    }
    if (accountType === 'phone' && isMobilePhone(account, 'zh-CN')) {
      user = await this.getByPhone(account, ['roles'])
    }
    // ???????????????
    if (signinType === 'authCode') {
      // ???????????????????????????
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
        // ???????????????
        if (!await this.authCodeService.checkAuthCode({
          account,
          code,
          codeType: CodeType.signin,
        })) {
          throw new BadRequestException('????????????????????????: ???????????????')
        }
      }
    }

    // ????????????
    if (signinType === 'password') {
      if (!user) {
        throw new BadRequestException('?????????????????????: ???????????????')
      }

      if (!this.cryptoUtil.checkPassword(code, user.password)) {
        throw new BadRequestException('?????????????????????: ????????????')
      }
    }

    if (!user) {
      throw new BadRequestException('???????????????')
    }

    return {
      ...this.buildRO(user),
      token: this.generateJWT(user),
    }
  }

  async create({
    accountType, account, authCode,
    ...dto
  }: CreateUserDto): Promise<UserEntity> {
    const curUser = geneNewEntity(UserEntity, {
      nickname: dto.nickname || await getRandomNickname(this.nicknameRepo),
      avatar: dto.avatar || getRandomAvatar(),
      password: dto.password || '',
    })

    switch (accountType) {
      case 'email':
        if (!isEmail(account)) {
          throw new BadRequestException('?????????????????????')
        }
        if (await this.getByEmail(account)) {
          throw new BadRequestException('???????????????')
        }
        curUser.email = account
        break
      case 'phone':
        if (!isMobilePhone(account, 'zh-CN')) {
          throw new BadRequestException('????????????????????????')
        }
        if (await this.getByPhone(account)) {
          throw new BadRequestException('???????????????')
        }
        curUser.phone = account
        break
      default:
        throw new BadRequestException(`unknown accountType: ${accountType}`)
    }

    if (!await this.authCodeService.checkAuthCode({
      account,
      code: authCode,
      codeType: CodeType.signin,
    })) {
      throw new BadRequestException('???????????????')
    }

    return this.userRepo.save(curUser)
  }

  async updateInfo(id: string, dto: UpdateUserInfoDto): Promise<boolean> {
    await this.userRepo.update({
      id,
    }, geneNewEntity(UserEntity, pick(dto, ['avatar', 'nickname', 'description'])))

    return true
  }

  async delete(id: string): Promise<boolean> {
    await this.userRepo.delete({
      id,
    })

    return true
  }

  /**
   * ???????????????????????????, ????????????????????????????????????, ???????????????
   */
  exportAsItem(user: UserEntity): UserRO {
    return {
      ...defaultUserRO,
      ...pick(user, ['id', 'nickname', 'phone', 'email', 'avatar', 'description']),
    }
  }

  public buildRO(user: UserEntity): UserRO {
    const filteredUser: UserRO = {
      ...defaultUserRO,
      ...pick(user, ['id', 'nickname', 'phone', 'email', 'avatar', 'description']),
      roles: (user.roles ?? []).map((item) => item.name),
      friends: (user.friends ?? []).map((item) => this.exportAsItem(item)),
      groups: (user.groups ?? []).map((item) => item.name),
    }

    return filteredUser
  }

  public generateJWT(user: UserEntity) {
    // jwt ??????????????????, ????????????, ???????????? 1000
    const now = Date.now() / 1000

    return this.jwtService.sign({
      id: user.id,
      name: user.nickname,
      email: user.email,
      iat: now,
      // ??????????????????????????????
      nbf: now - 1,
    })
  }
}
