import { AccountType, CodeType } from 'src/constants'
import { Column, Entity } from 'typeorm'
import { BaseEntityWithPrivateId } from './base.entity'

@Entity()
export class AuthCodeEntity extends BaseEntityWithPrivateId {
  @Column({ nullable: false })
  account: string;

  @Column({ nullable: false })
  code: string;

  @Column({ nullable: false })
  accountType: AccountType;

  @Column({ nullable: false })
  codeType: CodeType;
}
