import { BaseEntityWithPublicId } from 'src/entities/base.entity'
import { pick } from 'src/utils/object'
import { PageQuery } from 'src/utils/page'

export function limitPageQuery<E extends BaseEntityWithPublicId>({
  pageSize = 20,
  orderKeys = ['id', 'createdTime', 'updatedTime'],
}: {
  pageSize?: number;
  orderKeys?: (keyof E)[];
}) {
  type T = PageQuery<E, keyof E>

  return {
    transform(value: Partial<T>, metadata: any): T {
      try {
        const ret: T = {
          ...value,
          current: Math.max(value.current ?? 0, 1),
          pageSize: Math.min(value.pageSize ?? 20, pageSize),
          order: pick((value.order ?? {}) as T['order'], orderKeys),
        }
        return ret
      } catch (err) {
        throw new Error('分页请求参数有误')
      }
    }
  }
}
