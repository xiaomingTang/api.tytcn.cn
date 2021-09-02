import { TypeOrmModuleOptions } from '@nestjs/typeorm'
import { UserEntity } from 'src/entities'
import { getRandomAvatar } from 'src/modules/user/utils'

export const JWT_SECRET = 'my-nest-app-secret-1992'

export const JWT_EXPIRES_IN = '3600s'

export const IS_PUBLIC_KEY = 'is-public'

export const ROLES_KEY = 'roles'

export enum AccountType {
  phone = 'phone',
  email = 'email',
}

export enum CodeType {
  signin = 'signin',
}

export enum SigninType {
  password = 'password',
  authCode = 'authCode',
  qrcode = 'qrcode',
}

export enum MessageType {
  Text = 'Text',
  Image = 'Image',
  Video = 'Video',
  File = 'File',
}

export const TypeOrmConfig: TypeOrmModuleOptions = {
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: '123456',
  database: 'a',
  charset: 'utf8mb4', // 设置 chatset 编码为 utf8mb4
  autoLoadEntities: true,
  synchronize: true, // @WARNING 不应在生产中使用设置, 否则可能会丢失生产数据
  // entities: ["dist/entities/*.entity{.ts,.js}"],
}

export const ADMIN_ROLE_NAME = 'admin'
export const ADMIN_ID = 'admin'

export const CREATE_ADMIN_DTO: Partial<UserEntity> = {
  avatar: getRandomAvatar(6),
  nickname: '王小明',
  password: 'xiaoming1992',
  email: '1038761793@qq.com',
  phone: '17620307415',
}
