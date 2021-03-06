import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Between, Like, Repository } from 'typeorm'

import { GroupEntity, UserEntity } from 'src/entities'
import { dangerousAssignSome, deleteUndefinedProperties, geneNewEntity, pick } from 'src/utils/object'
import { CreateGroupDto } from './dto/create-group.dto'
import { UpdateGroupInfoDto } from './dto/update-group-info.dto'
import { defaultUserRO, UserRO, UserService } from '../user/user.service'
import { limitPageQuery } from 'src/shared/pipes/page-query.pipe'
import { genePageResPipe, PageQuery, PageRes } from 'src/utils/page'

export interface GroupRO {
  id: string;
  name: string;
  description: string;
  owner: UserRO;
}

export const defaultGroupRO: GroupRO = {
  id: '',
  name: '',
  description: '',
  owner: defaultUserRO,
}

export type SearchGroupParams = PageQuery<
  GroupEntity,
  'id' | 'name' | 'createdTime'
> & {
  id?: string;
  name?: string;
  createdTime?: [number, number];
  ownerId?: string;
}

export const SearchGroupQueryPipe = limitPageQuery<GroupEntity>({
  orderKeys: ['id', 'name', 'createdTime'],
})

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(GroupEntity)
    private readonly groupRepo: Repository<GroupEntity>,

    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,

    private readonly userService: UserService,
  ) {}

  async getById(id: string, relations: (keyof GroupEntity)[] = ['owner', 'users']) {
    const group = await this.groupRepo.findOne({
      where: {
        id,
      },
      relations,
    })
    if (!group) {
      throw new BadRequestException('群组不存在')
    }
    return group
  }

  async getHotGroups(): Promise<PageRes<GroupEntity>> {
    const now = new Date()
    // 一段时间内 (10min) 被更新过
    const timeBefore = new Date(now.getTime() - 1000 * 60 * 10)
    // +1s, 防止遗漏此时更新的 group
    const timeAfter = new Date(now.getTime() + 1000)
    return this.groupRepo.findAndCount({
      where: {
        updatedTime: Between(timeBefore, timeAfter),
      },
      order: {
        updatedTime: 'DESC',
      },
      // 取前 10 位
      take: 10,
    }).then(genePageResPipe({ current: 1, pageSize: 10 }))
  }

  /**
   * string 空值为 undefined 或 空字符串
   * array 空值为 undefined 或 []
   * 空值 时表示不限
   */
  async search({
    current, pageSize, order,
    id = '', name = '', createdTime, ownerId,
  }: SearchGroupParams, relations: (keyof GroupEntity)[] = ['owner']): Promise<PageRes<GroupEntity>> {
    return this.groupRepo.findAndCount({
      where: deleteUndefinedProperties({
        id: !id ? undefined : Like(`%${id}%`),
        name: !name ? undefined : Like(`%${name}%`),
        createdTime: !createdTime ? undefined : Between(...createdTime),
        owner: !ownerId ? undefined : {
          id: ownerId,
        },
      }),
      join: {
        alias: 'group',
        leftJoinAndSelect: {
          owner: 'group.owner',
        },
      },
      skip: (current - 1) * pageSize,
      take: pageSize,
      order: deleteUndefinedProperties(order),
      relations,
    }).then(genePageResPipe({ current, pageSize }))
  }

  async create(dto: CreateGroupDto): Promise<string> {
    const newGroup = dangerousAssignSome(new GroupEntity(), dto, 'name', 'description')
    newGroup.owner = await this.userService.getById(dto.ownerId)

    if (!newGroup.owner) {
      throw new Error('群创建者不存在')
    }

    try {
      const savedGroup = await this.groupRepo.save(newGroup)
      await this.userRepo.save(newGroup.owner)

      return savedGroup.id
    } catch (error) {
      throw new BadRequestException(`群组创建失败 ${error.message}`)
    }
  }

  async updateInfo(id: string, dto: UpdateGroupInfoDto): Promise<boolean> {
    await this.groupRepo.update({
      id,
    }, geneNewEntity(GroupEntity, pick(dto, ['name', 'description'])))

    return true
  }

  async delete(id: string): Promise<boolean> {
    await this.groupRepo.delete({
      id,
    })

    return true
  }

  /**
   * 作为其他对象的属性, 无需一些复杂的数组属性时, 使用该方法
   */
  exportAsItem(group: GroupEntity): GroupRO {
    return {
      ...defaultGroupRO,
      ...pick(group, ['id', 'name', 'description']),
      owner: group.owner ? this.userService.exportAsItem(group.owner) : defaultUserRO,
    }
  }

  buildRO(group: GroupEntity): GroupRO {
    return {
      ...defaultGroupRO,
      ...pick(group, ['id', 'name', 'description']),
      owner: group.owner ? this.userService.exportAsItem(group.owner) : defaultUserRO,
    }
  }
}
