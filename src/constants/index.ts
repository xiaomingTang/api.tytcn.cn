import { TypeOrmModuleOptions } from '@nestjs/typeorm'
import { CreateUser } from 'src/modules/user/dto/create-user.dto'

export const JWT_SECRET = 'my-nest-app-secret-1992'

export const JWT_EXPIRES_IN = '3600s'

export const IS_PUBLIC_KEY = 'is-public'

export const ROLES_KEY = 'roles'

export type AccountType = 'phone' | 'email'

export type CodeType = 'signin'

export type SigninType = 'password' | 'authCode' | 'qrcode'

export enum UserOnlineState {
  On = 'On',
  Off = 'Off',
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
export const ADMIN_PHONE = '17620307415'
export const ADMIN_EMAIL = '1038761793@qq.com'
const ADMIN_PASSWORD = 'xiaoming1992'

export const CREATE_ADMIN_BY_EMAIL_OBJ: CreateUser = {
  avatar: '/icon.png',
  nickname: 'admin',
  password: ADMIN_PASSWORD,
  authCode: '',
  accountType: 'email',
  account: ADMIN_EMAIL,
}
