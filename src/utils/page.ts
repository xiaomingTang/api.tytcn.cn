import { BaseEntityWithPublicId } from 'src/entities/base.entity'

export interface PageQuery<Entity extends BaseEntityWithPublicId, K extends keyof Entity> {
  current: number;
  pageSize: number;
  order?: Partial<Record<K, 'ASC' | 'DESC'>>;
}

export interface PageRes<T> {
  data: T[];
  current: number;
  pageSize: number;
  total: number;
}

export function genePageRes<T>(datas: T[], pageInfo: Exclude<PageRes<T>, 'data'>): PageRes<T> {
  return {
    ...pageInfo,
    data: datas,
  }
}

type Formatter<T, S> = (item: T, index: number, array: T[]) => S

export function formatPages<Entity extends BaseEntityWithPublicId, S>(
  res: PageRes<Entity>,
  formatter: Formatter<Entity, S>
): PageRes<S> {
  return {
    ...res,
    data: res.data.map(formatter),
  }
}
