import { Injectable } from '@nestjs/common'
import { ThrottlerGuard } from '@nestjs/throttler'

@Injectable()
export class FriendlyThrottlerGuard extends ThrottlerGuard {
  errorMessage = '请求过快, 先休息一下吧'
}
