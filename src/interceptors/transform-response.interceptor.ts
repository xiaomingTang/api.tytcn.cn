import {
  CallHandler, ExecutionContext, Injectable, NestInterceptor,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { UserEntity } from 'src/entities'
import { geneNewEntity } from 'src/utils/object'
import { Repository } from 'typeorm'

interface Res<T> {
  success: boolean;
  data: T;
  status: number;
  message: string;
}

@Injectable()
export class TransformResponseInterceptor<T> implements NestInterceptor<T, Res<T>> {
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<Res<T>> {
    return next.handle().pipe(map((data) => ({
      data,
      success: true,
      status: 200,
      message: '成功',
    })))
  }
}

@Injectable()
export class UpdateUserAccessTimeInterceptor<T> implements NestInterceptor<T, Res<T>> {
  constructor(
    @InjectRepository(UserEntity) private readonly userRepo?: Repository<UserEntity>
  ) {}
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<Res<T>> {
    const id: string = ctx.switchToHttp().getRequest().user?.id
    if (id) {
      /**
       * 更新用户访问时间
       */
      this.userRepo?.update({
        id,
      }, geneNewEntity(UserEntity, {
        updatedTime: new Date(),
      }))
    }
    return next.handle()
  }
}
