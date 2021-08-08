import { MessageType } from 'src/constants'
import {
  Column, Entity, ManyToOne, ManyToMany, JoinTable,
} from 'typeorm'
import { BaseEntityWithPrivateId } from './base.entity'
import { GroupEntity } from './group.entity'
import { UserEntity } from './user.entity'

@Entity()
export class MessageEntity extends BaseEntityWithPrivateId {
  @Column({ default: '' })
  content: string

  @Column({ default: MessageType.Text })
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
  @JoinTable()
  @ManyToMany(() => UserEntity, (u) => u.receivedMessages, {
    cascade: true,
  })
  toUsers?: UserEntity[]

  /**
   * 消息接收者(群组)
   */
  @JoinTable()
  @ManyToMany(() => GroupEntity, (g) => g.messages, {
    cascade: true,
  })
  toGroups?: GroupEntity[]
}
