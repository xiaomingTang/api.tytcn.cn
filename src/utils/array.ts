export type ArrayHandler<T, S> = (value: T, index: number, array: T[]) => Promise<S>

/**
 * 一般调用时为 await asyncForEach(...)
 */
export async function asyncForEach<T>(arr: T[], handler: ArrayHandler<T, any>): Promise<void> {
  for (let i = 0, len = arr.length; i < len; i += 1) {
    await handler(arr[i], i, arr)
  }
}

/**
 * 一般调用时为 await asyncMap(...)
 */
export async function asyncMap<T, S>(arr: T[], handler: ArrayHandler<T, S>): Promise<S[]> {
  const result: S[] = []
  for (let i = 0, len = arr.length; i < len; i += 1) {
    result.push(await handler(arr[i], i, arr))
  }
  return result
}
