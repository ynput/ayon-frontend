// take QueryFilter and transform them into something graphql can use

import { AttributeFilterInput, ProjectNodeTasksArgs } from '@shared/api'
import { QueryFilter, QueryCondition } from '@shared/containers/ProjectTreeTable/types/operations'
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

const getConditionsByKey = (queryFilter: QueryFilter, key: string): QueryCondition[] => {
  return (
    (queryFilter.conditions?.filter(
      (condition) => 'key' in condition && condition.key === key,
    ) as QueryCondition[]) || []
  )
}

const isNoValueCondition = (condition: QueryCondition): boolean => {
  return (
    condition.operator === 'eq' && Array.isArray(condition.value) && condition.value.length === 0
  )
}

const isHasValueCondition = (condition: QueryCondition): boolean => {
  return (
    condition.operator === 'ne' && Array.isArray(condition.value) && condition.value.length === 0
  )
}

interface FilterResult<T> {
  exact?: T[]
  any?: T[]
}

const formatQueryConditions = (conditions: QueryCondition[]): FilterResult<string> => {
  if (!conditions.length) {
    return {}
  }

  // Check for No Value conditions
  const noValueConditions = conditions.filter(isNoValueCondition)
  if (noValueConditions.length > 0) {
    return { exact: [] }
  }

  // Check for Has Value conditions
  const hasValueConditions = conditions.filter(isHasValueCondition)
  if (hasValueConditions.length > 0) {
    return { any: [] }
  }

  // Process regular value conditions
  const allValues: string[] = []
  for (const condition of conditions) {
    if (condition.value !== undefined && condition.value !== null) {
      if (Array.isArray(condition.value)) {
        allValues.push(...condition.value.map(String))
      } else {
        allValues.push(String(condition.value))
      }
    }
  }

  // For simplicity, we'll treat all as 'any' unless specifically configured otherwise
  return allValues.length > 0 ? { any: allValues } : {}
}

const formatSearchQueryFilters = (
  queryFilters: QueryFilter,
  slice: QueryFilter | null,
): FilterQueriesData => {
  // Handle empty or undefined queryFilters
  if (!queryFilters || !queryFilters.conditions?.length) {
    const emptyResults: FilterQueriesData = {
      assignees: undefined,
      assigneesAny: undefined,
      tags: undefined,
      tagsAny: undefined,
      taskTypes: undefined,
      statuses: undefined,
      attributes: undefined,
    }

    // Still process slice if it exists
    if (slice) {
      const filterMap: Record<
        SliceField,
        { exact: keyof FilterQueriesData; any: keyof FilterQueriesData }
      > = {
        assignees: { exact: 'assignees', any: 'assigneesAny' },
        status: { exact: 'statuses', any: 'statuses' },
        taskType: { exact: 'taskTypes', any: 'taskTypes' },
      }

      const sliceConditions =
        (slice.conditions?.filter((condition) => 'key' in condition) as QueryCondition[]) || []

      for (const condition of sliceConditions) {
        const filterKeys = filterMap[condition.key as SliceField]
        if (filterKeys) {
          if (isNoValueCondition(condition)) {
            emptyResults[filterKeys.exact] = []
          } else if (isHasValueCondition(condition)) {
            emptyResults[filterKeys.any] = []
          } else if (condition.value !== undefined && condition.value !== null) {
            const values = Array.isArray(condition.value)
              ? condition.value.map(String)
              : [String(condition.value)]
            if (values.length && filterKeys.any !== 'attributes') {
              emptyResults[filterKeys.any] = values
            }
          }
        }
      }
    }

    return emptyResults
  }

  // ASSIGNEES
  const assigneesConditions = getConditionsByKey(queryFilters, 'assignees')
  const { exact: assignees, any: assigneesAny } = formatQueryConditions(assigneesConditions)

  // TAGS
  const tagsConditions = getConditionsByKey(queryFilters, 'tags')
  const { exact: tags, any: tagsAny } = formatQueryConditions(tagsConditions)

  // TASK TYPES
  const taskTypeConditions = getConditionsByKey(queryFilters, 'taskType')
  const { any: taskTypes } = formatQueryConditions(taskTypeConditions)

  // STATUSES
  const statusConditions = getConditionsByKey(queryFilters, 'status')
  const { any: statuses } = formatQueryConditions(statusConditions)

  // ATTRIBUTES (anything not covered by the above)
  const attributeConditions =
    (queryFilters.conditions?.filter((condition) => {
      if (!('key' in condition)) return false
      const key = condition.key
      return !['assignees', 'tags', 'taskType', 'status'].includes(key)
    }) as QueryCondition[]) || []

  const attributes: AttributeFilterInput[] | undefined = attributeConditions.length
    ? attributeConditions.map((condition) => ({
        name: condition.key,
        values: Array.isArray(condition.value)
          ? condition.value.map(String)
          : condition.value !== undefined && condition.value !== null
          ? [String(condition.value)]
          : [],
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
    // Find slice conditions by looking for the slice field in the slice QueryFilter
    const sliceConditions =
      (slice.conditions?.filter((condition) => 'key' in condition) as QueryCondition[]) || []

    for (const condition of sliceConditions) {
      const filterKeys = filterMap[condition.key as SliceField]
      if (filterKeys) {
        if (isNoValueCondition(condition)) {
          results[filterKeys.exact] = []
        } else if (isHasValueCondition(condition)) {
          results[filterKeys.any] = []
        } else if (condition.value !== undefined && condition.value !== null) {
          const values = Array.isArray(condition.value)
            ? condition.value.map(String)
            : [String(condition.value)]
          if (values.length && filterKeys.any !== 'attributes') {
            results[filterKeys.any] = values
          }
        }
      }
    }
  }

  return results
}

export default formatSearchQueryFilters
