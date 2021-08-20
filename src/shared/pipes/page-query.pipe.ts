import { PageQuery } from 'src/constants'
import { BaseEntityWithPublicId } from 'src/entities/base.entity'
import { pick } from 'src/utils/object'

export function limitPageQuery<E extends BaseEntityWithPublicId>({
  size = 20,
  orderKeys = ['createdTime', 'updatedTime', 'id'],
}: {
  size?: number;
  orderKeys?: (keyof E)[];
}) {
  type T = PageQuery<E, keyof E>

  return {
    transform(value: T, metadata: any): T {
      try {
        const ret: T = {
          ...value,
          page: Math.max(value.page, 1),
          size: Math.min(value.size, size),
          order: pick(value.order, orderKeys),
        }
        return ret
      } catch (err) {
        throw new Error('分页请求参数有误')
      }
    }
  }
}
