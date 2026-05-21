import { useViewsContext } from '@shared/containers'
import { useViewUpdateHelper } from '@shared/containers/Views/utils/viewUpdateHelper'
import type { OverviewSettings } from '@shared/api/generated/views'
import { useCallback, useMemo, useState } from 'react'
import { AttributeModel } from '@shared/api'
import { useGlobalContext } from '@shared/context'
import { getAttributeIcon } from '@shared/util'

export type ProjectGroupOption = {
  id: string
  label: string
  icon?: string
}

const STATIC_GROUP_OPTIONS: ProjectGroupOption[] = [
  { id: 'projectFolder', label: 'Folder', icon: 'folder' },
  { id: 'active', label: 'Archived', icon: 'inventory_2' },
  { id: 'library', label: 'Library', icon: 'local_library' },
  { id: 'skeleton', label: 'Pipeline', icon: 'valve' },
]

const isGroupableProjectAttribute = (attribute: AttributeModel) =>
  attribute.scope?.includes('project') &&
  (attribute.data.type === 'boolean' || !!attribute.data.enum?.length)

/**
 * Manages groupBy state for the ProjectsPage, persisting to the working view.
 * The grouping is stored as an array of column IDs for TanStack Table compatibility.
 * Persistence stores a comma-separated string (e.g. "active,library") in `groupBy`.
 */
export const useProjectGrouping = () => {
  const { viewSettings } = useViewsContext()
  const { updateViewSettings } = useViewUpdateHelper()
  const { attributes } = useGlobalContext()
  const [localGrouping, setLocalGrouping] = useState<string[] | null>(null)
  const [localGroupSortByDesc, setLocalGroupSortByDesc] = useState<boolean | null>(null)

  const storedGrouping = useMemo<string[]>(() => {
    const settings = viewSettings as OverviewSettings | undefined
    if (!settings?.groupBy) return []
    return settings.groupBy.split(',').filter(Boolean)
  }, [viewSettings])

  const grouping: string[] = localGrouping ?? storedGrouping
  const storedGroupSortByDesc = useMemo(() => {
    const settings = viewSettings as OverviewSettings | undefined
    return settings?.groupSortByDesc ?? false
  }, [viewSettings])
  const groupSortByDesc = localGroupSortByDesc ?? storedGroupSortByDesc

  const groupableProjectAttributes = useMemo(
    () => attributes.filter(isGroupableProjectAttribute),
    [attributes],
  )

  const groupOptions = useMemo<ProjectGroupOption[]>(
    () => [
      ...STATIC_GROUP_OPTIONS,
      ...groupableProjectAttributes.map((attribute) => ({
        id: `attrib_${attribute.name}`,
        label: attribute.data.title || attribute.name,
        icon: getAttributeIcon(attribute.name, attribute.data.type, !!attribute.data.enum?.length),
      })),
    ],
    [groupableProjectAttributes],
  )

  const handleGroupingChange = useCallback(
    async (newGrouping: string[], newGroupSortByDesc?: boolean) => {
      const groupBy = newGrouping.length ? newGrouping.join(',') : undefined
      const nextGroupSortByDesc = newGrouping.length
        ? newGroupSortByDesc ?? groupSortByDesc
        : undefined

      const localSetter = (
        value: { grouping: string[]; groupSortByDesc: boolean | null } | null,
      ) => {
        setLocalGrouping(value?.grouping ?? null)
        setLocalGroupSortByDesc(value?.groupSortByDesc ?? null)
      }

      await updateViewSettings(
        { groupBy, groupSortByDesc: nextGroupSortByDesc },
        localSetter,
        {
          grouping: newGrouping,
          groupSortByDesc: nextGroupSortByDesc ?? null,
        },
        {},
      )
    },
    [groupSortByDesc, updateViewSettings],
  )

  return { grouping, groupSortByDesc, handleGroupingChange, groupOptions }
}
