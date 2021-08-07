import {
  Column, Entity, ManyToMany, OneToMany, BeforeInsert, JoinTable,
} from 'typeorm'
import * as argon2 from 'argon2'
import { IsEmail, IsPhoneNumber } from 'class-validator'

import { UserOnlineState } from 'src/constants'
import { GroupEntity } from './group.entity'
import { MessageEntity } from './message.entity'
import { RoleEntity } from './role.entity'
import { BaseEntityWithPublicId } from './base.entity'

@Entity()
export class UserEntity extends BaseEntityWithPublicId {
  @Column({
    default: '',
  })
  nickname!: string

  @Column({
    default: '',
  })
  @IsEmail()
  email!: string

  @Column({
    default: '',
  })
  @IsPhoneNumber('CN')
  phone!: string

  @Column({
    default: '',
  })
  password!: string

  @BeforeInsert()
  async hashPassword() {
    this.password = await argon2.hash(this.password)
  }

  @Column({
    default: '',
  })
  avatar!: string

  @Column({
    default: UserOnlineState.On,
  })
  onlineState!: UserOnlineState

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
  @ManyToMany(() => MessageEntity, (m) => m.toUsers)
  @JoinTable()
  receivedMessages?: MessageEntity[]
}
