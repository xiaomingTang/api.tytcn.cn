import { BadRequestException, Inject, Injectable, Scope } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Between, Like, Repository } from 'typeorm'

import { RoleEntity, UserEntity } from 'src/entities'
import { dangerousAssignSome, deleteUndefinedProperties, pick } from 'src/utils/object'
import { CreateRoleDto } from './dto/create-role.dto'
import { defaultUserRO, RequestWithUser, UserRO } from '../user/user.service'
import { genePageRes, PageQuery, PageRes } from 'src/utils/page'
import { limitPageQuery } from 'src/shared/pipes/page-query.pipe'
import { REQUEST } from '@nestjs/core'

export interface RoleRO {
  id: string;
  name: string;
  description: string;
  createdBy: UserRO;
}

export const defaultAuthCodeRO: RoleRO = {
  id: '',
  name: '',
  description: '',
  createdBy: defaultUserRO,
}

export type SearchRoleParams = PageQuery<
  RoleEntity,
  'id' | 'name' | 'description' | 'createdBy' | 'createdTime' | 'updatedTime'
> & {
  id?: string;
  name?: string;
  description?: string;
  createdBy?: string;
  createdTime?: [number, number];
  updatedTime?: [number, number];
}

export const SearchRoleQueryPipe = limitPageQuery<RoleEntity>({
  orderKeys: ['id', 'name', 'description', 'createdBy', 'createdTime', 'updatedTime'],
})

@Injectable({ scope: Scope.REQUEST })
export class RoleService {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly roleRepo: Repository<RoleEntity>,

    @Inject(REQUEST) private readonly request: RequestWithUser,
  ) {}

  async getById(id: string, relations: (keyof RoleEntity)[] = []) {
    const role = await this.roleRepo.findOne({
      where: {
        id,
      },
      relations,
    })
    if (!role) {
      throw new BadRequestException('角色不存在')
    }
    return role
  }

  async getByName(name: string, relations: (keyof RoleEntity)[] = []) {
    const role = await this.roleRepo.findOne({
      where: {
        name,
      },
      relations,
    })
    if (!role) {
      throw new BadRequestException('角色不存在')
    }
    return role
  }

  /**
   * string 空值为 undefined 或 空字符串
   * array 空值为 undefined 或 []
   * 空值 时表示不限
   */
  async search({
    current, pageSize, order,
    id = '', name = '', description = '', createdBy = '',
    createdTime, updatedTime,
  }: SearchRoleParams, relations: (keyof RoleEntity)[] = ['createdBy']): Promise<PageRes<RoleEntity>> {
    return this.roleRepo.findAndCount({
      where: deleteUndefinedProperties({
        id: !id ? undefined : Like(`%${id}%`),
        name: !name ? undefined : Like(`%${name}%`),
        description: !description ? undefined : Like(`%${description}%`),
        createdTime: !createdTime ? undefined : Between(...createdTime),
        updatedTime: !updatedTime ? undefined : Between(...updatedTime),
        // @TODO: 新增 createdBy 搜索
      }),
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

  async create(dto: CreateRoleDto): Promise<RoleEntity> {
    const newAuthCode = dangerousAssignSome(new RoleEntity(), dto, 'name', 'description')

    newAuthCode.createdBy = this.request.user as UserEntity
    if (!newAuthCode.createdBy) {
      throw new BadRequestException('创建者不存在')
    }

    try {
      const savedRole = await this.roleRepo.save(newAuthCode)

      return savedRole
    } catch (error) {
      throw new BadRequestException(`验证码发送失败: ${error.message}`)
    }
  }

  /**
   * 作为其他对象的属性, 无需一些复杂的数组属性时, 使用该方法
   */
  exportAsItem(role: RoleEntity): RoleRO {
    return {
      ...defaultAuthCodeRO,
      ...pick(role, ['id', 'name', 'description']),
    }
  }

  buildRO(role: RoleEntity): RoleRO {
    return {
      ...defaultAuthCodeRO,
      ...pick(role, ['id', 'name', 'description']),
    }
  }
}
