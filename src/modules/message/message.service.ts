import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Like, Repository, getRepository } from 'typeorm'

import { GroupEntity, MessageEntity, UserEntity } from 'src/entities'
import { dangerousAssignSome, pick } from 'src/utils/object'
import { CreateMessageDto } from './dto/create-message.dto'
import { defaultUserRO, UserRO, UserService } from '../user/user.service'
import { MessageType } from 'src/constants'
import { GetMessagesDto } from './dto/get-messages.dto'
import { asyncForEach } from 'src/utils/array'
import { GroupRO, GroupService } from '../group/group.service'

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

interface GetableParams<K extends keyof MessageEntity> {
  key: K;
  value: string;
  /**
   * @default false
   */
  fuzzy?: boolean;
  /**
   * @default []
   */
  relations?: (keyof MessageEntity)[];
}

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(MessageEntity)
    private readonly messageRepo: Repository<MessageEntity>,

    private readonly userService: UserService,
    private readonly groupService: GroupService,
  ) {}

  async getEntities({
    key,
    value,
    fuzzy = false,
    relations = [],
  }: GetableParams<'id' | 'content'>): Promise<MessageEntity[]> {
    if (!value) {
      throw new BadRequestException(`unknown value: ${value}`)
    }
    const searchableKeys: (keyof MessageEntity)[] = ['id', 'content']
    if (!searchableKeys.includes(key)) {
      throw new BadRequestException(`unknown key: ${key}`)
    }
    let datas: MessageEntity[] = []
    if (fuzzy) {
      datas = await this.messageRepo.find({
        where: {
          [key]: Like(`%${value}%`),
        },
        relations,
      })
    } else {
      const res = await this.messageRepo.findOne({
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

  async getsByFuzzySearch(dto: GetMessagesDto): Promise<MessageEntity[]> {
    const contentConvertedDto = pick(dto, ['content', 'fromUserId', 'toGroupId', 'toUserId', 'type'])
    contentConvertedDto.content = `%${contentConvertedDto.content}%`
    const messages = await getRepository(MessageEntity)
      .createQueryBuilder('message')
      .where([
        dto.fromUserId && 'fromUser.id = :fromUserId',
        dto.content && 'content like :content',
        dto.toUserId && ':toUserId = toUser.id',
        dto.toGroupId && ':toGroupId = toGroup.id',
        dto.type && 'type = :type',
      ].filter(Boolean).join(' AND '), contentConvertedDto)
      .leftJoin('message.fromUser', 'fromUser')
      .leftJoin('message.toUsers', 'toUser')
      .leftJoin('message.toGroups', 'toGroup')
      .getMany()
    return messages
  }

  async create(dto: CreateMessageDto): Promise<MessageRO> {
    const newMessage = dangerousAssignSome(new MessageEntity(), dto, 'content', 'type')

    newMessage.fromUser = await this.userService.getEntities({
      key: 'id',
      value: dto.fromUserId,
      relations: ['postedMessages'],
    })[0]

    const MAX_COUNT = 10
    if (dto.toUserIds.length > MAX_COUNT || dto.toGroupIds.length > MAX_COUNT) {
      throw new BadRequestException(`群发用户数或群组数不能超过 ${MAX_COUNT}`)
    }
    await asyncForEach(dto.toUserIds, async (id) => {
      const targetUser = await this.userService.getEntities({
        key: 'id',
        value: id,
      })[0]
      newMessage.toUsers = newMessage.toUsers ?? []
      newMessage.toUsers.push(targetUser)
    })
    await asyncForEach(dto.toGroupIds, async (id) => {
      const targetGroup = await this.groupService.getEntities({
        key: 'id',
        value: id,
      })[0]
      newMessage.toGroups = newMessage.toGroups ?? []
      newMessage.toGroups.push(targetGroup)
    })

    try {
      const savedMessage = await this.messageRepo.save(newMessage)
      return this.buildRO(savedMessage)
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
