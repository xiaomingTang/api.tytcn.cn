import { Column, Entity, ManyToMany, OneToOne } from 'typeorm'
import { BaseEntityWithPrivateId } from './base.entity'
import { UserEntity } from './user.entity'

@Entity()
export class RoleEntity extends BaseEntityWithPrivateId {
  @Column({ unique: true, nullable: false })
  name: string

  @Column({ default: '暂无描述' })
  description: string

  @OneToOne(() => UserEntity)
  createdBy: UserEntity;

  @ManyToMany(() => UserEntity, (u) => u.roles)
  users?: UserEntity[]
}
