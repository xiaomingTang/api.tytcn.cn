import { TypeOrmModuleOptions } from '@nestjs/typeorm'
import { FindManyOptions } from 'typeorm'
import { BaseEntityWithPublicId } from 'src/entities/base.entity'

export const JWT_SECRET = 'my-nest-app-secret-1992'

export const IS_PUBLIC_KEY = 'is-public'

export const ROLES_KEY = 'roles'

export const JWT_EXPIRES_IN = '3600s'

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
  database: 'chat-room',
  charset: 'utf8mb4', // 设置 chatset 编码为 utf8mb4
  autoLoadEntities: true,
  synchronize: true, // @WARNING 不应在生产中使用设置, 否则可能会丢失生产数据
  // entities: ["dist/entities/*.entity{.ts,.js}"],
}

export type AccountType = 'phone' | 'email'

export type CodeType = 'signin'

export type SigninType = 'passport' | 'authCode' | 'qrcode'

export interface PageQuery<Entity extends BaseEntityWithPublicId, K extends keyof Entity> {
  page: number;
  size: number;
  order: Record<K, 'ASC' | 'DESC'>;
}

export interface PageRes<T> {
  data: T[];
  page: number;
  size: number;
  total: number;
  more: boolean;
}
