import {
  CallHandler, ExecutionContext, Injectable, NestInterceptor,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

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
