import { QueryCondition, QueryFilter } from '@shared/containers'

const isCondition = (c: QueryCondition | QueryFilter): c is QueryCondition => 'key' in c

// Persisted filters come back from the views API with `value: null` filled in.
// The server rejects null values even for isnull/notnull, so drop the key entirely.
export const sanitizeQueryFilter = (filter: QueryFilter): QueryFilter => ({
  ...filter,
  conditions: filter.conditions?.map((c) => {
    if (!isCondition(c)) return sanitizeQueryFilter(c)
    if ((c.operator === 'isnull' || c.operator === 'notnull') && c.value == null) {
      const { value, ...rest } = c
      return rest
    }
    return c
  }),
})
