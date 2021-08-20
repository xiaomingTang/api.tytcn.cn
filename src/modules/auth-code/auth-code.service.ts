import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Between, Repository } from 'typeorm'

import { AuthCodeEntity } from 'src/entities'
import { dangerousAssignSome, pick } from 'src/utils/object'
import { AccountType, CodeType } from 'src/constants'
import { CreateAuthCodeDto } from './dto/create-auth-code.dto'
import { isEmail } from 'class-validator'

export interface AuthCodeRO {
  account: string;

  code: string;

  accountType: AccountType;

  codeType: CodeType;
}

export const defaultAuthCodeRO: AuthCodeRO = {
  account: '',

  code: '',

  accountType: 'phone',

  codeType: 'signin',
}

@Injectable()
export class AuthCodeService {
  constructor(
    @InjectRepository(AuthCodeEntity)
    private readonly authCodeRepo: Repository<AuthCodeEntity>,
  ) {}

  async checkAuthCode({ account, code, codeType }: {
    account: string;
    code: string;
    codeType: CodeType;
  }) {
    const now = new Date()
    // (60s)有效期之前
    const timeBefore = new Date(now.getTime() - 1000 * 60)
    const authCode = (await this.authCodeRepo.findOne({
      where: {
        account,
        accountType: isEmail(account) ? 'email' : 'phone',
        codeType,
        createdTime: Between(timeBefore, now),
      },
      order: {
        createdTime: 'DESC',
      },
    }))

    if (authCode && authCode.code === code) {
      return true
    }

    return false
  }

  async create(dto: CreateAuthCodeDto): Promise<string> {
    const newAuthCode = dangerousAssignSome(new AuthCodeEntity(), dto, 'account', 'accountType', 'codeType')

    // 在此处加入生成及发送验证码的逻辑
    newAuthCode.code = `${Math.floor(Math.random() * 8999) + 1000}`

    try {
      const savedAuthCode = await this.authCodeRepo.save(newAuthCode)

      return savedAuthCode.code
    } catch (error) {
      throw new BadRequestException(`验证码发送失败 ${error.message}`)
    }
  }

  /**
   * 作为其他对象的属性, 无需一些复杂的数组属性时, 使用该方法
   */
  exportAsItem(group: AuthCodeEntity): AuthCodeRO {
    return {
      ...defaultAuthCodeRO,
      ...pick(group, ['id', 'account', 'accountType', 'code', 'codeType']),
    }
  }

  buildRO(group: AuthCodeEntity): AuthCodeRO {
    return {
      ...defaultAuthCodeRO,
      ...pick(group, ['id', 'account', 'accountType', 'code', 'codeType']),
    }
  }
}
