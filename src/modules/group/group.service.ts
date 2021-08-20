import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Like, Repository } from 'typeorm'

import { GroupEntity, UserEntity } from 'src/entities'
import { dangerousAssignSome, pick } from 'src/utils/object'
import { CreateGroupDto } from './dto/create-group.dto'
import { UpdateGroupInfoDto } from './dto/update-group-info.dto'
import { defaultUserRO, UserRO, UserService } from '../user/user.service'
import { PageQuery } from 'src/constants'
import { limitPageQuery } from 'src/shared/pipes/page-query.pipe'

export type GetsByNameParam = PageQuery<GroupEntity, 'name' | 'createdTime' | 'id'> & {
  name: string;
}

export const GetsByNameQueryPipe = limitPageQuery<GroupEntity>({
  orderKeys: ['name', 'createdTime', 'id'],
})

export interface GroupRO {
  id: string;
  name: string;
  notice: string;
  owner: UserRO;
}

export const defaultGroupRO: GroupRO = {
  id: '',
  name: '',
  notice: '',
  owner: defaultUserRO,
}

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(GroupEntity)
    private readonly groupRepo: Repository<GroupEntity>,

    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,

    private readonly userService: UserService,
  ) {}

  async getById(id: string) {
    return this.groupRepo.findOne({
      where: {
        id,
      },
      relations: ['owner', 'users'],
    })
  }

  async getsByName({
    page, size, order, name,
  }: GetsByNameParam) {
    return this.groupRepo.find({
      where: {
        name: Like(`%${name}%`),
      },
      skip: (page - 1) * size,
      take: size,
      order,
      relations: ['owner'],
    })
  }

  async create(dto: CreateGroupDto): Promise<string> {
    const newGroup = dangerousAssignSome(new GroupEntity(), dto, 'name', 'notice')
    newGroup.owner = await this.userService.getById(dto.ownerId, ['ownGroups'])

    if (!newGroup.owner) {
      throw new Error('用户不存在')
    }

    newGroup.owner.ownGroups.push(newGroup)

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
    }, pick(dto, ['name', 'notice']))

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
      ...pick(group, ['id', 'name', 'notice']),
      owner: group.owner ? this.userService.exportAsItem(group.owner) : defaultUserRO,
    }
  }

  buildRO(group: GroupEntity): GroupRO {
    return {
      ...defaultGroupRO,
      ...pick(group, ['id', 'name', 'notice']),
      owner: group.owner ? this.userService.exportAsItem(group.owner) : defaultUserRO,
    }
  }
}
