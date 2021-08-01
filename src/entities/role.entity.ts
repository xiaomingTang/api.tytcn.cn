import { Column, Entity, ManyToMany } from 'typeorm'
import { BaseEntityWithPrivateId } from './base.entity'
import { UserEntity } from './user.entity'

@Entity()
export class RoleEntity extends BaseEntityWithPrivateId {
  @Column({ unique: true })
  name!: string

  @Column({ default: '描述' })
  description!: string

  @ManyToMany(() => UserEntity, (u) => u.roles)
  users?: UserEntity
}
