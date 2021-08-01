import { randomInt } from 'src/utils/math'
import {
  BeforeInsert, BeforeUpdate, Column, Entity, PrimaryGeneratedColumn,
} from 'typeorm'

@Entity()
class BaseEntity {
  get _prefix() {
    return ''
  }

  get _suffix() {
    return ''
  }

  @PrimaryGeneratedColumn()
  _id!: number

  @Column({ unique: true })
  id!: string

  /**
   * 生成 id
   * 可能会重复, 但是概率很低
   * 一旦重复了, 数据库会报错, 给用户报错
   */
  @BeforeInsert()
  async geneId() {
    const randValue = randomInt(10 ** 16, 10 ** 17, true)
    this.id = this._prefix + randValue.toString(36) + this._suffix
  }

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdTime!: Date

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedTime!: Date

  @BeforeUpdate()
  updateTimestamp() {
    this.updatedTime = new Date()
  }
}

export class BaseEntityWithPublicId extends BaseEntity {
  get _prefix() {
    return ''
  }
}

export class BaseEntityWithPrivateId extends BaseEntity {
  get _prefix() {
    return `${Date.now().toString(36)}-`
  }
}
