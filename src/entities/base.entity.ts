import { randomInt } from 'src/utils/math'
import {
  BeforeInsert, BeforeUpdate, Column, Entity, PrimaryGeneratedColumn,
} from 'typeorm'

@Entity()
class BaseEntity {
  /**
   * 生成 id
   * 可能会重复, 但是概率很低
   * 一旦重复了, 数据库会报错, 给用户报错
   */
  @BeforeInsert()
  private async geneId() {
    const randString = randomInt(10 ** 16, 10 ** 17, true).toString(36)
    this.id = (this._prefix ?? '') + randString + (this._suffix ?? '')
  }
 
  @BeforeUpdate()
  private updateTimestamp() {
    this.updatedTime = new Date()
  }

  @Column({ default: '' })
  _prefix: string

  @Column({ default: '' })
  _suffix: string

  @PrimaryGeneratedColumn()
  private _id: number

  @Column({ default: '' })
  id: string

  @Column({ default: '暂无描述' })
  description: string

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdTime: Date

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedTime: Date
}

export class BaseEntityWithPublicId extends BaseEntity {
  @Column({ default: '' })
  _prefix: string
}

export class BaseEntityWithPrivateId extends BaseEntity {
  @Column({ default: `${Date.now().toString(36)}-` })
  _prefix: string
}
