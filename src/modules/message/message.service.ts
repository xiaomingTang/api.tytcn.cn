import { BadRequestException, ForbiddenException, Inject, Injectable, Scope, UnauthorizedException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { REQUEST } from '@nestjs/core'
import { Request } from 'express'
import { Like, Repository, Between, In, Any } from 'typeorm'

import { MessageEntity, UserEntity } from 'src/entities'
import { dangerousAssignSome, deleteUndefinedProperties, pick } from 'src/utils/object'
import { MessageType } from 'src/constants'
import { asyncForEach } from 'src/utils/array'
import { genePageRes, PageQuery, PageRes } from 'src/utils/page'
import { limitPageQuery } from 'src/shared/pipes/page-query.pipe'

import { CreateMessageDto } from './dto/create-message.dto'
import { defaultUserRO, UserRO, UserService } from '../user/user.service'
import { defaultGroupRO, GroupRO, GroupService } from '../group/group.service'
import { isAdmin } from 'src/utils/auth'

export interface MessageRO {
  id: string;
  content: string;
  type: MessageType;
  fromUser: UserRO;
  toUser: UserRO;
  toGroup: GroupRO;
}

export const defaultMessageRO: MessageRO = {
  id: '',
  content: '',
  type: MessageType.Text,
  fromUser: defaultUserRO,
  toUser: defaultUserRO,
  toGroup: defaultGroupRO,
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

export type GetMessageListParams = PageQuery<
  MessageEntity,
  'type' | 'createdTime'
> & {
  masterId: string;
  targetType?: 'user' | 'group';
  targetId?: string;
}

export const GetMessageListQueryPipe = limitPageQuery<MessageEntity>({
  orderKeys: ['type', 'createdTime'],
})

@Injectable({ scope: Scope.REQUEST })
export class MessageService {
  constructor(
    @InjectRepository(MessageEntity)
    private readonly messageRepo: Repository<MessageEntity>,

    @Inject(REQUEST) private readonly request: Request,

    private readonly userService: UserService,
    private readonly groupService: GroupService,
  ) {}

  get requestUser() {
    return this.request.user as UserEntity | undefined
  }

  get selfId() {
    return this.requestUser?.id ?? ''
  }

  async getById(id: string, relations: (keyof MessageEntity)[] = []) {
    const message = await this.messageRepo.findOne({
      where: {
        id,
      },
      relations,
    })
    if (!message) {
      throw new BadRequestException('消息不存在')
    }
    return message
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
  }: SearchMessageParams, relations: (keyof MessageEntity)[] = ['fromUser']): Promise<PageRes<MessageEntity>> {
    if (!this.selfId) {
      throw new UnauthorizedException()
    }
    if (!isAdmin(this.request)) {
      if (fromUserId !== this.selfId) {
        if (toUserId && toUserId !== this.selfId) {
          throw new ForbiddenException('你无权查看他人信息')
        }
        if (toGroupId && !await this.userService.isInGroup({ userId: this.selfId, groupId: toGroupId })) {
          throw new ForbiddenException('你不是群成员, 无法查看群消息')
        }
      }
    }
    return this.messageRepo.findAndCount({
      where: deleteUndefinedProperties({
        id: !id ? undefined : id,
        content: !content ? undefined : Like(`%${content}%`),
        type: !type ? undefined : type,
        createdTime: !createdTime ? undefined : Between(...createdTime),
        fromUser: !fromUserId ? undefined : {
          id: fromUserId,
        },
        toUser: !toUserId ? undefined : {
          id: toUserId,
        },
        toGroup: !toGroupId ? undefined : {
          id: toGroupId,
        },
      }),
      join: {
        alias: 'user',
        leftJoin: {
          fromUser: 'user.fromUser',
          toUser: 'user.toUser',
          toGroup: 'user.toGroup',
        },
      },
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
   * @param masterId 我们希望查询的用户id
   * @param targetType 该用户发生交流的其他用户或群组
   * @param targetId 用户或群组id
   */
  async getMessageList({
    current, pageSize, order,
    masterId, targetId, targetType,
  }: GetMessageListParams) {
    if (!isAdmin(this.request) && masterId !== this.selfId) {
      throw new ForbiddenException()
    }
    const restParams = {
      skip: (current - 1) * pageSize,
      take: pageSize,
      order: deleteUndefinedProperties(order),
      join: {
        alias: 'user',
        leftJoin: {
          fromUser: 'user.fromUser',
          toUser: 'user.toUser',
          toGroup: 'user.toGroup',
        },
      }
    }
    if (!targetId) {
      return this.messageRepo.findAndCount({
        where: [
          {
            fromUser: {
              id: masterId,
            },
          },
          {
            toUser: {
              id: masterId,
            },
          },
          {
            toGroup: In(this.requestUser?.groups || []),
          },
        ],
        ...restParams,
      }).then(([entities, total]) => {
        return genePageRes(entities, {
          data: entities,
          current,
          pageSize,
          total,
        })
      })
    }
    if (targetType === 'user') {
      return this.messageRepo.findAndCount({
        where: [
          {
            fromUser: {
              id: masterId,
            },
            toUser: {
              id: targetId,
            }
          },
          {
            fromUser: {
              id: targetId,
            },
            toUser: {
              id: masterId,
            }
          },
        ],
        ...restParams,
      }).then(([entities, total]) => {
        return genePageRes(entities, {
          data: entities,
          current,
          pageSize,
          total,
        })
      })
    }
    if (targetType === 'group') {
      return this.messageRepo.findAndCount({
        where: {
          fromUser: {
            id: masterId,
          },
          toGroup: {
            id: targetId,
          }
        },
        ...restParams,
      }).then(([entities, total]) => {
        return genePageRes(entities, {
          data: entities,
          current,
          pageSize,
          total,
        })
      })
    }
  }

  async create(dto: CreateMessageDto): Promise<MessageEntity> {
    const newMessage = dangerousAssignSome(new MessageEntity(), dto, 'content', 'type')

    newMessage.fromUser = this.requestUser

    try {
      if (dto.toUserId) {
        newMessage.toUser = await this.userService.getById(dto.toUserId)
      } else if (dto.toGroupId) {
        newMessage.toGroup = await this.groupService.getById(dto.toGroupId)
      } else {
        throw new BadRequestException('没有收信人')
      }

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
      toUser: message.toUser ? this.userService.exportAsItem(message.toUser) : defaultUserRO,
      toGroup: message.toGroup ? this.groupService.exportAsItem(message.toGroup) : defaultGroupRO,
    }
  }
}
