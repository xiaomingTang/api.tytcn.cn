import { Column, Entity, ManyToMany, OneToOne } from 'typeorm'
import { BaseEntityWithPrivateId } from './base.entity'
import { UserEntity } from './user.entity'

@Entity()
export class RoleEntity extends BaseEntityWithPrivateId {
  @Column({ unique: true, nullable: false })
  name: string

  @OneToOne(() => UserEntity)
  createdBy: UserEntity;

  @ManyToMany(() => UserEntity, (u) => u.roles)
  users?: UserEntity[]
}
