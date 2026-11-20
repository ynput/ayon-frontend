import { useMemo } from 'react'
import { groupByToStatsTarget, selectGroupCounts } from '@shared/api'
import overviewApi from '@shared/api/queries/overview/getOverview'
import { useOptionalProjectContext } from '@shared/context'
import { getTaskProgressViewSettings } from '@shared/containers/ProjectTreeTable'
import type { ViewPreset } from '@shared/containers/Views/types'
import { useAppDispatch } from '@state/store'
import { DEFAULT_COLUMNS_FOLDER, DEFAULT_COLUMNS_TASK } from '@pages/ProjectsPage/constants'

const TASK_TYPE_TARGET = groupByToStatsTarget({ id: 'taskType' }, 'task')
// what the Overview shows when a view does not list a column
const OVERVIEW_DEFAULT_COLUMNS = Object.keys({
  ...DEFAULT_COLUMNS_TASK,
  ...DEFAULT_COLUMNS_FOLDER,
  entityType: true,
})

// The ready-made views a page ships with, by view type.
export const useViewPresets = (viewType?: string): ViewPreset[] | undefined => {
  const dispatch = useAppDispatch()
  const { projectName, taskTypes } = useOptionalProjectContext() || {}
  // by content: the project info is a new object after every refetch
  const taskTypesKey = JSON.stringify((taskTypes || []).map(({ name }) => name))

  return useMemo(() => {
    const names: string[] = JSON.parse(taskTypesKey)
    if (viewType !== 'overview' || !projectName || !names.length) return undefined

    // Task progress: a column per task type that has tasks, in the project's order. Asked for
    // when the preset is picked, so the page load does not pay for it.
    const getTaskProgressSettings = async () => {
      const used = new Set<string>()
      try {
        const stats = await dispatch(
          overviewApi.endpoints.GetTaskColumnStats.initiate(
            { projectName, targets: TASK_TYPE_TARGET ? [TASK_TYPE_TARGET] : [] },
            { subscribe: false, forceRefetch: true },
          ),
        ).unwrap()
        selectGroupCounts(stats, TASK_TYPE_TARGET).counts.forEach((_count, type) => used.add(type))
      } catch {
        // without the counts every task type gets a column
      }
      const usedNames = names.filter((name) => used.has(name))
      return getTaskProgressViewSettings(
        usedNames.length ? usedNames : names,
        OVERVIEW_DEFAULT_COLUMNS,
      )
    }

    return [
      {
        id: 'taskProgress',
        label: 'Task progress',
        icon: 'view_week',
        settings: getTaskProgressSettings,
      },
    ]
  }, [viewType, projectName, taskTypesKey, dispatch])
}
