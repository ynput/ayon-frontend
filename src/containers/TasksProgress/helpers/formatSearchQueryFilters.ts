// take filters from the search filter and transform them into something graphql can use

import { AttributeFilterInput, ProjectNodeTasksArgs } from '@shared/api'
import getFilterFromId from '@components/SearchFilter/getFilterFromId'
import { Filter } from '@ynput/ayon-react-components'
import { SliceType } from '@shared/containers'

export type TaskProgressSliceType = Extract<
  SliceType,
  'hierarchy' | 'assignees' | 'status' | 'taskType'
>

type SliceField = Exclude<TaskProgressSliceType, 'hierarchy'>

export type FilterQueriesData = Pick<
  ProjectNodeTasksArgs,
  'assignees' | 'assigneesAny' | 'tags' | 'tagsAny' | 'taskTypes' | 'statuses' | 'attributes'
>

const filterIsNoValue = (filter: Filter) => filter.values?.some((v) => v.id === 'noValue') ?? false
const filterIsHasValue = (filter: Filter) =>
  filter.values?.some((v) => v.id === 'hasValue') ?? false

interface FilterResult<T> {
  exact?: T[]
  any?: T[]
}

const formatFilter = (filter: Filter | undefined, filterId: string): FilterResult<string> => {
  if (!filter || !filter.values?.length || getFilterFromId(filter.id) !== filterId) {
    return {}
  }

  if (filterIsNoValue(filter)) {
    return { exact: [] }
  }

  if (filterIsHasValue(filter)) {
    return { any: [] }
  }

  const values = filter.values.map((v) => v.id)
  return filter.operator === 'OR' ? { any: values } : { exact: values }
}

const formatSearchQueryFilters = (filters: Filter[], slice: Filter | null): FilterQueriesData => {
  // ASSIGNEES
  const { exact: assignees, any: assigneesAny } = formatFilter(
    filters.find((f) => getFilterFromId(f.id) === 'assignees'),
    'assignees',
  )

  // TAGS
  const { exact: tags, any: tagsAny } = formatFilter(
    filters.find((f) => getFilterFromId(f.id) === 'tags'),
    'tags',
  )

  // TASK TYPES
  const { any: taskTypes } = formatFilter(
    filters.find((f) => getFilterFromId(f.id) === 'taskType'),
    'taskType',
  )

  // STATUSES
  const { any: statuses } = formatFilter(
    filters.find((f) => getFilterFromId(f.id) === 'status'),
    'status',
  )

  // ATTRIBUTES (anything not covered by the above)
  const attributeFilters = filters.filter(
    (f) =>
      !['assignees', 'tags', 'taskType', 'status'].includes(getFilterFromId(f.id)) &&
      f.values?.length,
  )
  const attributes: AttributeFilterInput[] | undefined = attributeFilters.length
    ? attributeFilters.map((f) => ({
        name: getFilterFromId(f.id),
        values: f.values?.map((v) => v.id) ?? [],
      }))
    : undefined

  const results: FilterQueriesData = {
    assignees,
    assigneesAny,
    tags,
    tagsAny,
    taskTypes,
    statuses,
    attributes,
  }

  // finally add the slice filter query, it will replace any other filters that conflict
  const filterMap: Record<
    SliceField,
    { exact: keyof FilterQueriesData; any: keyof FilterQueriesData }
  > = {
    assignees: { exact: 'assignees', any: 'assigneesAny' },
    status: { exact: 'statuses', any: 'statuses' },
    taskType: { exact: 'taskTypes', any: 'taskTypes' },
  }

  if (slice) {
    const filterKeys = filterMap[slice.id as SliceField]
    if (filterKeys) {
      const values = slice.values?.map((v) => v.id)
      if (values && values.length) {
        if (values.includes('noValue')) {
          results[filterKeys.exact] = []
        } else if (values.includes('hasValue')) {
          results[filterKeys.any] = []
        } else if (filterKeys.any !== 'attributes') {
          results[filterKeys.any] = values
        }
      }
    }
  }

  return results
}

export default formatSearchQueryFilters
