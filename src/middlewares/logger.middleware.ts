import { Injectable, NestMiddleware } from '@nestjs/common'
import { NextFunction, Request, Response } from 'express'
import { formatTimeForFileName } from 'src/utils/time'

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log(`${formatTimeForFileName()}: request ${req.originalUrl}`)
    next()
  }
}
