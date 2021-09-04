import {
  ArgumentsHost, Catch, ExceptionFilter, HttpStatus,
} from '@nestjs/common'
import { Response } from 'express'

/**
 * 会将服务器错误包装为"未知错误"
 */
@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const res = ctx.getResponse<Response>()

    console.log(exception)

    res
      .status(HttpStatus.OK)
      .json({
        data: null,
        success: false,
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: exception.message,
      })
  }
}
