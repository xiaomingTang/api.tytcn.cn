import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Like, Repository } from 'typeorm'

import { GroupEntity, UserEntity } from 'src/entities'
import { dangerousAssignSome, pick } from 'src/utils/object'
import { CreateGroupDto } from './dto/create-group.dto'
import { UpdateGroupInfoDto } from './dto/update-group-info.dto'
import { defaultUserRO, UserRO, UserService } from '../user/user.service'

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

interface GetableParams<K extends keyof GroupEntity> {
  key: K;
  value: string;
  /**
   * @default false
   */
  fuzzy?: boolean;
  /**
   * @default []
   */
  relations?: (keyof GroupEntity)[];
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

  async getEntities({
    key,
    value,
    fuzzy = false,
    relations = [],
  }: GetableParams<'id' | 'name'>): Promise<GroupEntity[]> {
    if (!value) {
      throw new BadRequestException(`unknown value: ${value}`)
    }
    const searchableKeys: (keyof GroupEntity)[] = ['id', 'name']
    if (!searchableKeys.includes(key)) {
      throw new BadRequestException(`unknown key: ${key}`)
    }
    let datas: GroupEntity[] = []
    if (fuzzy) {
      datas = await this.groupRepo.find({
        where: {
          [key]: Like(`%${value}%`),
        },
        relations,
      })
    } else {
      const res = await this.groupRepo.findOne({
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

  async create(dto: CreateGroupDto): Promise<GroupRO> {
    const newGroup = dangerousAssignSome(new GroupEntity(), dto, 'name', 'notice')
    const users = await this.userService.getEntities({
      key: 'id', value: dto.ownerId, relations: ['ownGroups']
    })

    newGroup.owner = users[0]

    if (!newGroup.owner) {
      throw new Error('用户不存在')
    }

    newGroup.owner.ownGroups.push(newGroup)

    try {
      const savedGroup = await this.groupRepo.save(newGroup)
      await this.userRepo.save(newGroup.owner)

      return this.buildRO(savedGroup)
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
