import { SetMetadata } from '@nestjs/common'
import { IS_PUBLIC_KEY, ROLES_KEY } from 'src/constants'

export function Roles(...roles: string[]) {
  return SetMetadata(ROLES_KEY, roles)
}

export function IsPublic() {
  return SetMetadata(IS_PUBLIC_KEY, true)
}
