import { BadRequestException, Inject, Injectable, Scope } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { REQUEST } from '@nestjs/core'
import { Request } from 'express'
import { Like, Repository, Between, In } from 'typeorm'

import { MessageEntity, UserEntity } from 'src/entities'
import { dangerousAssignSome, deleteUndefinedProperties, pick } from 'src/utils/object'
import { MessageType } from 'src/constants'
import { genePageResPipe, PageQuery, PageRes } from 'src/utils/page'
import { limitPageQuery } from 'src/shared/pipes/page-query.pipe'

import { CreateMessageDto } from './dto/create-message.dto'
import { defaultUserRO, UserRO, UserService } from '../user/user.service'
import { defaultGroupRO, GroupRO, GroupService } from '../group/group.service'

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

  get requestId() {
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
      throw new BadRequestException('???????????????')
    }
    return message
  }

  /**
   * string ????????? undefined ??? ????????????
   * array ????????? undefined ??? []
   * ?????? ???????????????
   */
  async search({
    current, pageSize, order,
    id = '', content = '', type,
    createdTime, fromUserId, toUserId, toGroupId,
  }: SearchMessageParams, relations: (keyof MessageEntity)[] = []): Promise<PageRes<MessageEntity>> {
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
    }).then(genePageResPipe({ current, pageSize }))
  }

  /**
   * ?????? ??????-?????? ??? ??????-?????? ????????????
   * @param masterId ???????????????????????????id
   * @param targetType ?????????????????????????????????????????????
   * @param targetId ???????????????id, ???????????????
   */
  async getMessageList({
    current, pageSize, order,
    masterId, targetId, targetType,
  }: GetMessageListParams) {
    const restParams = {
      skip: (current - 1) * pageSize,
      take: pageSize,
      order: deleteUndefinedProperties(order),
      join: {
        alias: 'message',
        leftJoinAndSelect: {
          fromUser: 'message.fromUser',
          toUser: 'message.toUser',
          toGroup: 'message.toGroup',
        },
      }
    }
    const master = await this.userService.getById(masterId, ['groups'])
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
            toGroup: In(master.groups),
          },
        ],
        ...restParams,
      }).then(genePageResPipe({ current, pageSize }))
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
      }).then(genePageResPipe({ current, pageSize }))
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
      }).then(genePageResPipe({ current, pageSize }))
    }
    throw new BadRequestException('?????????????????????????????????')
  }

  async getChatList(userId: string) {
    // @TODO ?????????(???????????????????????????)
    const user = await this.userService.getById(userId, ['groups'])
    const messageList = await this.messageRepo.find({
      where: [
        {
          fromUser: {
            id: userId,
          },
        },
        {
          toUser: {
            id: userId,
          },
        },
        {
          toGroup: In(user.groups),
        },
      ],
      join: {
        alias: 'message',
        leftJoinAndSelect: {
          fromUser: 'message.fromUser',
          toUser: 'message.toUser',
          toGroup: 'message.toGroup',
        },
      },
      relations: ['fromUser', 'toUser', 'toGroup'],
      order: {
        updatedTime: 'DESC',
      },
    })
    const messageObj: Record<string, MessageEntity> = {}
    messageList.forEach((m) => {
      const key = [m.fromUser?.id, m.toUser?.id, m.toGroup?.id].sort().join('-')
      if (!messageObj[key]) {
        messageObj[key] = m
      }
    })
    return Object.values(messageObj).sort((a, b) => b.updatedTime.getTime() - a.updatedTime.getTime())
  }

  async create(dto: CreateMessageDto): Promise<MessageEntity> {
    const newMessage = dangerousAssignSome(new MessageEntity(), dto, 'content', 'type')

    try {
      if (dto.fromUserId) {
        newMessage.fromUser = await this.userService.getById(dto.fromUserId)
      }
  
      if (dto.toUserId) {
        newMessage.toUser = await this.userService.getById(dto.toUserId)
      }

      if (dto.toGroupId) {
        newMessage.toGroup = await this.groupService.getById(dto.toGroupId)
      }

      if (!newMessage.fromUser) {
        throw new BadRequestException('???????????????')
      }

      if (!newMessage.toUser && !newMessage.toGroup) {
        throw new BadRequestException('???????????????')
      }

      return this.messageRepo.save(newMessage)
    } catch (error) {
      throw new BadRequestException(`??????????????????: ${error.message}`)
    }
  }

  async delete(id: string): Promise<boolean> {
    await this.messageRepo.delete({
      id,
    })

    return true
  }

  /**
   * ???????????????????????????, ????????????????????????????????????, ???????????????
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
