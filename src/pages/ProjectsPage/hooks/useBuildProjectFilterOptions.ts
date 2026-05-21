import { useMemo } from 'react'
import { useGetAttributeListQuery } from '@shared/api'
import { usePowerpack } from '@shared/context'
import { getAttributeIcon } from '@shared/util'
import { generateDateOptions } from '@shared/components/SearchFilter/filterDates'

// Minimal option shape matching what SearchFilter expects
export type ProjectFilterOption = {
  id: string
  type?:
    | 'string'
    | 'boolean'
    | 'integer'
    | 'float'
    | 'datetime'
    | 'list_of_strings'
    | 'list_of_integers'
    | 'list_of_any'
    | 'list_of_submodels'
    | 'dict'
  label: string
  icon?: string | null
  inverted?: boolean
  operator?: 'AND' | 'OR'
  values?: { id: string; label: string; icon?: string | null; color?: string | null }[]
  allowsCustomValues?: boolean
  allowHasValue?: boolean
  allowNoValue?: boolean
  allowExcludes?: boolean
  operatorChangeable?: boolean
  singleSelect?: boolean
}

export const useBuildProjectFilterOptions = (): ProjectFilterOption[] => {
  const { powerLicense } = usePowerpack()
  const { data: attributes = [] } = useGetAttributeListQuery()

  return useMemo(() => {
    const options: ProjectFilterOption[] = [
      // Active status
      {
        id: 'active',
        type: 'boolean',
        label: 'Archived',
        icon: 'inventory_2',
        singleSelect: true,
        values: [
          { id: 'false', label: 'Archived', icon: 'inventory_2' },
          { id: 'true', label: 'Active', icon: 'check_circle' },
        ],
      },
      // Library flag
      {
        id: 'library',
        type: 'boolean',
        label: 'Library',
        icon: 'local_library',
        singleSelect: true,
        values: [
          { id: 'true', label: 'Library', icon: 'local_library' },
          { id: 'false', label: 'Not library', icon: 'do_not_disturb_on' },
        ],
      },
      // Pipeline flag
      {
        id: 'skeleton',
        type: 'boolean',
        label: 'Pipeline',
        icon: 'valve',
        singleSelect: true,
        values: [
          { id: 'false', label: 'Pipeline' },
          { id: 'true', label: 'Skeleton' },
        ],
      },
    ]

    // Add project-scoped attributes that are boolean, datetime, or have enum values
    const projectAttribs = attributes.filter(
      (attr) =>
        attr.scope?.includes('project') &&
        (attr.data.type === 'boolean' || attr.data.type === 'datetime' || !!attr.data.enum?.length),
    )

    for (const attr of projectAttribs) {
      const isEnum = !!attr.data.enum?.length

      let values: ProjectFilterOption['values'] = []
      if (isEnum && attr.data.enum) {
        values = attr.data.enum.map((e) => ({
          id: String(e.value),
          label: String(e.label ?? e.value),
          icon: (e as any).icon ?? null,
          color: (e as any).color ?? null,
        }))
      } else if (attr.data.type === 'boolean') {
        values = [
          { id: 'true', label: 'True', icon: 'check_box' },
          { id: 'false', label: 'False', icon: 'check_box_outline_blank' },
        ]
      }
      // datetime gets preset options + custom range
      if (attr.data.type === 'datetime') {
        values = generateDateOptions() as ProjectFilterOption['values']
      }

      options.push({
        id: `attrib_${attr.name}`,
        type: attr.data.type,
        label: attr.data.title || attr.name,
        icon: getAttributeIcon(attr.name, attr.data.type, isEnum),
        singleSelect: ['boolean', 'datetime'].includes(attr.data.type || ''),
        allowsCustomValues: false,
        allowHasValue: powerLicense,
        allowNoValue: powerLicense,
        allowExcludes: powerLicense,
        operatorChangeable: powerLicense && isEnum,
        values,
      })
    }

    return options
  }, [attributes, powerLicense])
}
