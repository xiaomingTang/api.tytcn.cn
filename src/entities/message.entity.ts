import { MessageType } from 'src/constants'
import {
  Column, Entity, ManyToOne,
} from 'typeorm'
import { BaseEntityWithPrivateId } from './base.entity'
import { GroupEntity } from './group.entity'
import { UserEntity } from './user.entity'

const defaultMessageType = 'Text' as MessageType

@Entity()
export class MessageEntity extends BaseEntityWithPrivateId {
  @Column({ default: '' })
  content: string

  @Column({ default: defaultMessageType })
  type: MessageType

  // -------------------------
  // 其他复杂关系
  // -------------------------

  /**
   * 消息发出者
   */
  @ManyToOne(() => UserEntity, (u) => u.postedMessages, {
    cascade: true,
  })
  fromUser?: UserEntity

  /**
   * 消息接收者(用户)
   */
  @ManyToOne(() => UserEntity, (u) => u.receivedMessages, {
    cascade: true,
  })
  toUser?: UserEntity

  /**
   * 消息接收者(群组)
   */
  @ManyToOne(() => GroupEntity, (g) => g.messages, {
    cascade: true,
  })
  toGroup?: GroupEntity
}
