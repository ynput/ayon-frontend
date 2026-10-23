import type {
  QueryCondition,
  QueryFilter,
} from '@shared/containers/ProjectTreeTable/types/operations'

const ATTRIB_PREFIX = 'attrib.'

// Attribute conditions on values the table shows from the entity filter by the entity's values
// (the query's `attrib` has the list item's values over the entity's)
export const toEntityValueKeys = (
  filter: QueryFilter,
  readsEntityValue?: (attrib: string) => boolean,
): QueryFilter => {
  if (!readsEntityValue) return filter
  return {
    ...filter,
    conditions: filter.conditions?.map((condition) => {
      if ('conditions' in condition) return toEntityValueKeys(condition, readsEntityValue)
      const { key } = condition as QueryCondition
      if (!key.startsWith(ATTRIB_PREFIX)) return condition
      const attrib = key.slice(ATTRIB_PREFIX.length).split('.')[0]
      return readsEntityValue(attrib)
        ? { ...condition, key: `entityAttrib.${key.slice(ATTRIB_PREFIX.length)}` }
        : condition
    }),
  }
}
