import {
  ArgumentsHost, Catch, HttpException, HttpStatus,
} from '@nestjs/common'
import WebSocket from 'ws'
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets'

@Catch()
export class WsExceptionFilter extends BaseWsExceptionFilter {
  catch(exception: HttpException | WsException | Error, host: ArgumentsHost) {
    super.catch(exception, host)
    const ctx = host.switchToWs()
    const client = ctx.getClient<WebSocket>()
    let status = HttpStatus.INTERNAL_SERVER_ERROR
    if (exception instanceof HttpException) {
      status = exception.getStatus()
    }

    client.send(JSON.stringify({
      data: null,
      success: false,
      status,
      message: exception.message,
    }))
  }
}
