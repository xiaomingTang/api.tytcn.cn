import {
  Column, Entity,
} from 'typeorm'
import { BaseEntityWithPublicId } from './base.entity'

@Entity()
export class NicknameEntity extends BaseEntityWithPublicId {
  @Column({ default: '' })
  name: string
}
