import {
  Column, Entity, ManyToMany, ManyToOne,
} from 'typeorm'
import { BaseEntityWithPublicId } from './base.entity'
import { MessageEntity } from './message.entity'
import { UserEntity } from './user.entity'

@Entity()
export class GroupEntity extends BaseEntityWithPublicId {
  @Column({ unique: true, nullable: false })
  name: string

  // -------------------------
  // 其他复杂关系
  // -------------------------

  /**
   * 群主
   */
  @ManyToOne(() => UserEntity, (u) => u.ownGroups)
  owner?: UserEntity

  /**
   * 群员
   */
  @ManyToMany(() => UserEntity, (u) => u.groups)
  users?: UserEntity[]

  /**
   * 已接收消息
   */
  @ManyToMany(() => MessageEntity, (m) => m.toGroup)
  messages?: MessageEntity[]
}
