import {
  Column, Entity, ManyToMany, OneToMany, BeforeInsert, JoinTable,
} from 'typeorm'
import { createHash } from 'crypto'
import { IsEmail, IsMobilePhone } from 'class-validator'

import { GroupEntity } from './group.entity'
import { MessageEntity } from './message.entity'
import { RoleEntity } from './role.entity'
import { BaseEntityWithPublicId } from './base.entity'

@Entity()
export class UserEntity extends BaseEntityWithPublicId {
  @BeforeInsert()
  private async hashPassword() {
    this.password = createHash('sha256').update(this.password).digest('hex')
  }

  @Column({ default: '' })
  password: string

  @Column({ default: '' })
  nickname: string

  @Column({ unique: true, nullable: true })
  @IsEmail()
  email: string

  @Column({ unique: true, nullable: true })
  @IsMobilePhone('zh-CN')
  phone: string

  @Column({ default: '' })
  avatar: string

  // -------------------------
  // 其他复杂关系
  // -------------------------

  @ManyToMany(() => UserEntity, (u) => u.friends)
  @JoinTable()
  friends?: UserEntity[]

  @ManyToMany(() => RoleEntity, (r) => r.users, {
    cascade: true,
  })
  @JoinTable()
  roles?: RoleEntity[]

  /**
   * 加入的群组
   */
  @ManyToMany(() => GroupEntity, (g) => g.users, {
    cascade: true,
  })
  @JoinTable()
  groups?: GroupEntity[]

  /**
   * 拥有的群组(是群主)
   */
  @OneToMany(() => GroupEntity, (g) => g.owner, {
    cascade: true,
  })
  @JoinTable()
  ownGroups?: GroupEntity[]

  /**
   * 已发送消息
   */
  @OneToMany(() => MessageEntity, (m) => m.fromUser)
  @JoinTable()
  postedMessages?: MessageEntity[]

  /**
   * 已接收消息
   */
  @OneToMany(() => MessageEntity, (m) => m.toUser)
  @JoinTable()
  receivedMessages?: MessageEntity[]
}
