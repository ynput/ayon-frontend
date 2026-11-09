import { format } from 'date-fns'
import {
  Filter,
  getFilterFromId,
  Option,
  SEARCH_FILTER_ID,
} from '@ynput/ayon-react-components'
import type { EventFilters, Severity } from '../types'
import { getDateOptions, isDatePreset } from './datePresets'
import { getCategoryMeta, getStatusMeta, SEVERITIES, STATUSES } from './eventMeta'

type OptionsData = {
  categories: string[]
  topics: string[]
  projects: string[]
  users: string[]
  /** filtering by entity needs the admin-only query endpoint */
  canFilterByEntity: boolean
}

const list = (id: string, label: string, icon: string, values: Option['values']): Option => ({
  id,
  label,
  icon,
  type: 'list_of_strings',
  operator: 'OR',
  values,
})

export const buildEventFilterOptions = (data: OptionsData): Option[] => [
  list(
    'type',
    'Type',
    'category',
    data.categories.map((id) => {
      const meta = getCategoryMeta(id)
      return { id, label: meta.label, icon: meta.icon, color: meta.color }
    }),
  ),
  list(
    'severity',
    'Severity',
    'report',
    SEVERITIES.map(({ value, label, icon }) => ({ id: value, label, icon })),
  ),
  list(
    'status',
    'Status',
    'check_circle',
    STATUSES.map(({ value, label, icon }) => ({ id: value, label, icon })),
  ),
  {
    ...list(
      'topic',
      'Topic',
      'tag',
      data.topics.map((id) => ({ id, label: id })),
    ),
    allowsCustomValues: true,
    tooltip: 'Pick a topic or type one, use * as a wildcard',
  },
  list(
    'project',
    'Project',
    'folder',
    data.projects.map((id) => ({ id, label: id })),
  ),
  list(
    'user',
    'User',
    'person',
    data.users.map((id) => ({ id, label: id, img: `/api/users/${id}/avatar` })),
  ),
  {
    id: 'date',
    label: 'Date',
    icon: 'calendar_today',
    type: 'datetime',
    singleSelect: true,
    values: getDateOptions(),
  },
  ...(data.canFilterByEntity
    ? [
        {
          id: 'entity',
          label: 'Entity',
          icon: 'deployed_code',
          type: 'string' as const,
          singleSelect: true,
          allowsCustomValues: true,
          values: [],
          tooltip: 'Type an entity id',
        },
      ]
    : []),
  {
    id: 'hideLogs',
    label: 'Hide logs',
    icon: 'terminal',
    type: 'boolean',
    singleSelect: true,
    values: [],
  },
]

const formatDate = (iso: string) => format(new Date(iso), 'd MMM HH:mm')

const dateValue = ({ datePreset, newerThan, olderThan }: EventFilters, options: Option[]) => {
  if (datePreset) {
    const preset = options.find((o) => o.id === 'date')?.values?.find((v) => v.id === datePreset)
    return preset ?? { id: datePreset, label: datePreset }
  }
  // the id format is what useDateRangeFilter reads back when the chip is clicked
  return {
    id: `custom-${newerThan ?? ''}-${olderThan ?? ''}`,
    label: `${newerThan ? formatDate(newerThan) : '…'} – ${
      olderThan ? formatDate(olderThan) : 'now'
    }`,
    values: [
      { id: newerThan ?? '', label: newerThan ?? '' },
      ...(olderThan ? [{ id: olderThan, label: olderThan }] : []),
    ],
  }
}

/** One chip per filter. Ids are stable (one chip per key), so equal filters serialise equally. */
export const eventFiltersToClientFilters = (
  filters: EventFilters,
  options: Option[],
  entityLabel?: string,
): Filter[] => {
  const chip = (id: string, ids: string[] | undefined): Filter[] => {
    if (!ids?.length) return []
    const option = options.find((o) => o.id === id)
    return [
      {
        id,
        label: option?.label ?? id,
        icon: option?.icon,
        type: option?.type,
        operator: option?.operator,
        singleSelect: option?.singleSelect,
        values: ids.map((value) => {
          const match = option?.values?.find((v) => v.id === value)
          return match ?? { id: value, label: statusOrRawLabel(id, value) }
        }),
      },
    ]
  }

  const result: Filter[] = [
    ...chip('type', filters.types),
    ...chip('severity', filters.severities),
    ...chip('status', filters.statuses),
    ...chip('topic', filters.topics),
    ...chip('project', filters.projects),
    ...chip('user', filters.users),
  ]

  if (filters.datePreset || filters.newerThan || filters.olderThan) {
    const value = dateValue(filters, options)
    result.push({
      id: 'date',
      label: 'Date',
      icon: 'calendar_today',
      type: 'datetime',
      singleSelect: true,
      values: [value],
    })
  }
  if (filters.entity) {
    result.push({
      id: 'entity',
      label: 'Entity',
      icon: 'deployed_code',
      type: 'string',
      singleSelect: true,
      values: [{ id: filters.entity, label: entityLabel || filters.entity }],
    })
  }
  if (filters.hideLogs) {
    result.push({
      id: 'hideLogs',
      label: 'Hide logs',
      icon: 'terminal',
      type: 'boolean',
      singleSelect: true,
      values: [{ id: 'true', label: 'Yes' }],
    })
  }
  if (filters.search) {
    result.push({
      id: SEARCH_FILTER_ID,
      label: '',
      values: [{ id: filters.search, label: filters.search }],
    })
  }
  return result
}

const statusOrRawLabel = (filterId: string, value: string) =>
  filterId === 'status' ? getStatusMeta(value).label : value

/** Every key is set, so applying the result as a patch also removes what was taken off the bar */
export const clientFiltersToEventFilters = (clientFilters: Filter[]): EventFilters => {
  const values = (key: string) => {
    const filter = clientFilters.find((f) => getFilterFromId(f.id) === key)
    const ids = (filter?.values ?? []).map((v) => v.id)
    return ids.length ? ids : undefined
  }

  // a date value carries its range as nested values, see dateValue
  const date = clientFilters.find((f) => getFilterFromId(f.id) === 'date')?.values?.[0] as
    | Option
    | undefined
  const datePreset = isDatePreset(date?.id) ? date?.id : undefined

  return {
    search: values(SEARCH_FILTER_ID)?.join(' '),
    types: values('type'),
    severities: values('severity') as Severity[] | undefined,
    statuses: values('status'),
    topics: values('topic'),
    projects: values('project'),
    users: values('user'),
    entity: values('entity')?.[0].trim().replace(/-/g, ''),
    datePreset,
    newerThan: datePreset ? undefined : date?.values?.[0]?.id || undefined,
    olderThan: datePreset ? undefined : date?.values?.[1]?.id || undefined,
    hideLogs: values('hideLogs')?.includes('true') || undefined,
  }
}
