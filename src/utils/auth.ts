import { ForbiddenException } from '@nestjs/common'
import { Request } from 'express'
import { UserEntity } from 'src/entities'

export function onlySomeAccessible(request: Request, ...ids: string[]) {
  const id = (request.user as UserEntity | undefined)?.id
  if (!ids.includes(id)) {
    throw new ForbiddenException()
  }
}
