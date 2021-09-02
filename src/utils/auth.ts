import { ForbiddenException } from '@nestjs/common'
import { Request } from 'express'
import { ADMIN_ROLE_NAME } from 'src/constants'
import { UserEntity } from 'src/entities'

export function isAdmin(request: Request) {
  const roles = (request.user as UserEntity | undefined)?.roles ?? []
  return !!roles.find((role) => role.name === ADMIN_ROLE_NAME)
}

export function onlySomeAccessible(request: Request, ...ids: string[]) {
  const id = (request.user as UserEntity | undefined)?.id
  if (!ids.includes(id)) {
    throw new ForbiddenException()
  }
}
