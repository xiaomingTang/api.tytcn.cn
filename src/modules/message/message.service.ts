import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Like, Repository, Between } from 'typeorm'

import { MessageEntity } from 'src/entities'
import { dangerousAssignSome, deleteUndefinedProperties, pick } from 'src/utils/object'
import { CreateMessageDto } from './dto/create-message.dto'
import { defaultUserRO, UserRO, UserService } from '../user/user.service'
import { MessageType } from 'src/constants'
import { asyncForEach } from 'src/utils/array'
import { GroupRO, GroupService } from '../group/group.service'
import { genePageRes, PageQuery, PageRes } from 'src/utils/page'
import { limitPageQuery } from 'src/shared/pipes/page-query.pipe'

export interface MessageRO {
  id: string;
  content: string;
  type: MessageType;
  fromUser: UserRO;
  toUsers: UserRO[];
  toGroups: GroupRO[];
}

export const defaultMessageRO: MessageRO = {
  id: '',
  content: '',
  type: MessageType.Text,
  fromUser: defaultUserRO,
  toUsers: [],
  toGroups: [],
}

export type SearchMessageParams = PageQuery<
  MessageEntity,
  'id' | 'content' | 'type' | 'createdTime'
> & {
  id?: string;
  content?: string;
  type?: MessageType;
  createdTime?: [number, number];
  fromUserId?: string;
  toUserId?: string;
  toGroupId?: string;
}

export const SearchMessageQueryPipe = limitPageQuery<MessageEntity>({
  orderKeys: ['id', 'content', 'type', 'createdTime', 'fromUser'],
})

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(MessageEntity)
    private readonly messageRepo: Repository<MessageEntity>,

    private readonly userService: UserService,
    private readonly groupService: GroupService,
  ) {}

  async getById(id: string, relations: (keyof MessageEntity)[] = []) {
    return this.messageRepo.findOne({
      where: {
        id,
      },
      relations,
    })
  }

  /**
   * string 空值为 undefined 或 空字符串
   * array 空值为 undefined 或 []
   * 空值 时表示不限
   */
  async search({
    current, pageSize, order,
    id = '', content = '', type,
    createdTime, fromUserId, toUserId, toGroupId,
  }: SearchMessageParams): Promise<PageRes<MessageEntity>> {
    return this.messageRepo.findAndCount({
      where: deleteUndefinedProperties({
        id: !id ? undefined : Like(`%${id}%`),
        content: !content ? undefined : Like(`%${content}%`),
        createdTime: !createdTime ? undefined : Between(...createdTime),
        type: !type ? undefined : type,
        // @TODO: 需要增加 fromUserId, toUserId, toGroupId 查询
        // 其中当请求者是 admin 时, fromUser 有效
        // 当请求者不是 admin 时, fromUser 为请求者的 id
      }),
      skip: (current - 1) * pageSize,
      take: pageSize,
      order: deleteUndefinedProperties(order),
      relations: ['fromUser'],
    }).then(([entities, total]) => {
      return genePageRes(entities, {
        data: entities,
        current,
        pageSize,
        total,
      })
    })
  }

  async create(dto: CreateMessageDto): Promise<MessageEntity> {
    const newMessage = dangerousAssignSome(new MessageEntity(), dto, 'content', 'type')

    newMessage.fromUser = await this.userService.getById(dto.fromUserId, ['postedMessages'])

    const MAX_COUNT = 10
    if (dto.toUserIds.length > MAX_COUNT || dto.toGroupIds.length > MAX_COUNT) {
      throw new BadRequestException(`群发用户数或群组数不能超过 ${MAX_COUNT}`)
    }
    await asyncForEach(dto.toUserIds, async (id) => {
      const targetUser = await this.userService.getById(id)
      newMessage.toUsers = newMessage.toUsers ?? []
      newMessage.toUsers.push(targetUser)
    })
    await asyncForEach(dto.toGroupIds, async (id) => {
      const targetGroup = await this.groupService.getById(id)
      newMessage.toGroups = newMessage.toGroups ?? []
      newMessage.toGroups.push(targetGroup)
    })

    try {
      return this.messageRepo.save(newMessage)
    } catch (error) {
      throw new BadRequestException(`消息发送失败: ${error.message}`)
    }
  }

  async delete(id: string): Promise<boolean> {
    await this.messageRepo.delete({
      id,
    })

    return true
  }

  /**
   * 作为其他对象的属性, 无需一些复杂的数组属性时, 使用该方法
   */
  exportAsItem(message: MessageEntity): MessageRO {
    return {
      ...defaultMessageRO,
      ...pick(message, ['id', 'content', 'type']),
      fromUser: this.userService.exportAsItem(message.fromUser),
    }
  }

  buildRO(message: MessageEntity): MessageRO {
    return {
      ...defaultMessageRO,
      ...pick(message, ['id', 'content', 'type']),
      fromUser: message.fromUser ? this.userService.exportAsItem(message.fromUser) : defaultUserRO,
      toUsers: (message.toUsers ?? []).map((item) => this.userService.exportAsItem(item)),
      toGroups: (message.toGroups ?? []).map((item) => this.groupService.exportAsItem(item)),
    }
  }
}
