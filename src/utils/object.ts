import { BaseEntity } from 'typeorm'

type ObjectKey = string | number | symbol

/**
 * !!! 注意, 该方法直接修改 target 参数
 * !!! 下面的第 2 条暂无法实现, 需要调用者自行注意, !!! 不要将类型不一致的 key 放到 keys 参数中
 *
 * 本函数应当保证:
 *   1. 不增加属性; (已由 typescript 类型推导实现限制)
 *   2. 不改变 value 类型; (暂无法实现)
 *
 * (我写不出准确的 typescript 类型推断)
 * (...keys: K[] 需要保证 T[K] 和 S[K] 类型相同, 但是这样的推断我写不出来)
 */
export function dangerousAssignSome<T extends Record<string, any>, S extends Record<string, any>, K extends keyof(T | S)>(
  target: T,
  source: S,
  ...keys: K[]): T {
  keys.forEach((k) => {
    const val = source[k] as T[K]
    if (val === null || val === undefined) {
      return
    }
    target[k] = val
  })
  return target
}

export function pick<T extends Record<ObjectKey, any>, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>
  keys.forEach((k) => {
    result[k] = obj[k]
  })
  return result
}

export function deleteUndefinedProperties<T extends Record<ObjectKey, any>>(obj: T): T {
  Object.keys(obj).forEach((key) => {
    if (obj[key] === undefined) {
      delete obj[key]
    }
  })
  return obj
}

export function geneNewEntity<Entity = BaseEntity>(prototype: new () => Entity, record: Partial<Entity>): Entity {
  const obj = new prototype()
  Object.entries(record).forEach(([key, value]) => {
    obj[key] = value
  })
  return obj
}
