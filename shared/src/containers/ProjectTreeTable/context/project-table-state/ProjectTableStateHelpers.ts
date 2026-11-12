import type { QueryFilter, TableFilterEntity } from '@ynput/ayon-addon'

type FilterInput = { conditions?: unknown[]; operator?: 'and' | 'or' } | undefined

/** The entities' filters without the ones that have no conditions. */
export const toTableStateFilters = (
  filters: Partial<Record<TableFilterEntity, FilterInput>>,
): Partial<Record<TableFilterEntity, QueryFilter>> => {
  const result: Partial<Record<TableFilterEntity, QueryFilter>> = {}
  for (const [entity, filter] of Object.entries(filters) as [TableFilterEntity, FilterInput][]) {
    if (filter?.conditions?.length) result[entity] = filter as QueryFilter
  }
  return result
}

/** The ids, or `undefined` when there are none. */
export const nonEmptyIds = (ids: string[] | undefined) => (ids?.length ? ids : undefined)
