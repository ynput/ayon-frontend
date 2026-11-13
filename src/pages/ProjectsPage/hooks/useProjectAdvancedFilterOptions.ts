import { useMemo } from 'react'
import { useGetAttributeListQuery } from '@shared/api'
import { getAttributeIcon } from '@shared/util'
import type { ProjectFilterOption } from './useBuildProjectFilterOptions'

// the flags as "<true value> is true / is false" (the search bar shows them by their values)
const FLAG_LABELS: Record<string, string> = {
  active: 'Active',
  library: 'Library',
  skeleton: 'Planning',
}

const PROJECT_FIELDS: ProjectFilterOption[] = [
  { id: 'name', type: 'string', label: 'Name', icon: 'title', allowsCustomValues: true },
  { id: 'label', type: 'string', label: 'Label', icon: 'label', allowsCustomValues: true },
  { id: 'code', type: 'string', label: 'Code', icon: 'tag', allowsCustomValues: true },
  { id: 'createdAt', type: 'datetime', label: 'Created', icon: 'calendar_add_on' },
  { id: 'updatedAt', type: 'datetime', label: 'Updated', icon: 'update' },
]

// The fields of the advanced filter on the projects page: the search bar's options, the
// project's text fields and dates, and its text and number attributes (rows are filtered here,
// so any of their values can be used).
export const useProjectAdvancedFilterOptions = (
  options: ProjectFilterOption[],
): ProjectFilterOption[] => {
  const { data: attributes = [] } = useGetAttributeListQuery()

  return useMemo(() => {
    const valueAttributes: ProjectFilterOption[] = attributes
      .filter(
        (attr) =>
          attr.scope?.includes('project') &&
          !attr.data.enum?.length &&
          ['string', 'integer', 'float'].includes(attr.data.type || ''),
      )
      .map((attr) => ({
        id: `attrib_${attr.name}`,
        type: attr.data.type,
        label: attr.data.title || attr.name,
        icon: getAttributeIcon(attr.name, attr.data.type, false),
        allowsCustomValues: true,
      }))

    const searchBarFields = options.map((option) =>
      FLAG_LABELS[option.id] ? { ...option, label: FLAG_LABELS[option.id] } : option,
    )
    return [...PROJECT_FIELDS, ...searchBarFields, ...valueAttributes]
  }, [attributes, options])
}
