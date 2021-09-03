import { createParamDecorator } from '@nestjs/common'
import { UserEntity } from 'src/entities'

export const RequestUser = createParamDecorator((data, req) => {
  return req.user as UserEntity | undefined
})

export const RequestUserId = createParamDecorator((data, req) => {
  return req.user?.id ?? '' as string
})
