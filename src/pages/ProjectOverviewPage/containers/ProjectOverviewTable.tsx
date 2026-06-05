import { useCallback, useMemo } from 'react'

// UI components
import { Section } from '@ynput/ayon-react-components'

// Components
import {
  useProjectTableContext,
  useColumnSettingsContext,
  ProjectTreeTable,
} from '@shared/containers/ProjectTreeTable'
import {
  mergeFieldStats,
  buildMetricTargets,
  totalRowsFromStats,
} from '@shared/containers/ProjectTreeTable'
import type { FieldStats } from '@shared/containers/ProjectTreeTable'
import { useNewEntityContext } from '@context/NewEntityContext'
import { useProjectContext } from '@shared/context'
import { useViewsContext } from '@shared/containers'
import { useGetFolderColumnStatsQuery, useGetTaskColumnStatsQuery } from '@shared/api'
import { useProjectOverviewContext } from '../context/ProjectOverviewContext'

type Props = {}

const ProjectOverviewTable = ({}: Props) => {
  const { projectName } = useProjectContext()
  // the heavy lifting is done in ProjectTableContext and is where the data is fetched
  const { showHierarchy, isFlatFolderView, isLoading, fetchNextPage, attribFields } =
    useProjectTableContext()
  const { columnVisibility } = useColumnSettingsContext()
  // hold stats queries until views load, otherwise targets cover every column
  const { isLoadingViews } = useViewsContext()
  const { folderFilters, taskFilters, selectedFolders, selectedTaskIds, foldersMap } =
    useProjectOverviewContext()

  // Mirror the task list query: slicer selection narrows rows to the selected
  // subtree (foldersMap is already subtree-filtered when a slice is active);
  // an entity-list task selection takes precedence over folder ids.
  const statsTaskIds = selectedTaskIds.length ? selectedTaskIds : undefined
  const statsFolderIds = useMemo(
    () => (!statsTaskIds && selectedFolders.length ? Array.from(foldersMap.keys()) : undefined),
    [statsTaskIds, selectedFolders, foldersMap],
  )

  const { onOpenNew } = useNewEntityContext()

  const scope = `overview-${projectName}`

  // Live folder + task stats (backend fieldStats) — no mock fallback, cells
  // without backend data render blank. Folder stats feed folder columns +
  // folder count; task stats feed task columns + task count (filters mirror
  // each entity's list query).
  const folderTargets = useMemo(
    () => buildMetricTargets({ entity: 'folder', attribs: attribFields, columnVisibility }),
    [attribFields, columnVisibility],
  )
  const taskTargets = useMemo(
    () => buildMetricTargets({ entity: 'task', attribs: attribFields, columnVisibility }),
    [attribFields, columnVisibility],
  )

  const { data: liveFolderStats } = useGetFolderColumnStatsQuery(
    {
      projectName,
      filter: folderFilters?.filterString || undefined,
      search: folderFilters?.search || undefined,
      folderIds: statsFolderIds,
      targets: folderTargets,
    },
    { skip: !projectName || isLoadingViews },
  )
  const { data: liveTaskStats } = useGetTaskColumnStatsQuery(
    {
      projectName,
      filter: taskFilters?.filterString || undefined,
      folderFilter: folderFilters?.filterString || undefined,
      search: taskFilters?.search || undefined,
      folderIds: statsFolderIds,
      taskIds: statsTaskIds,
      targets: taskTargets,
    },
    { skip: !projectName || isLoadingViews },
  )
  // Primary scope = tasks (the table rows); folder stats feed the
  // "include groups & folders" row scope via groupFieldStats.
  const fieldStats = useMemo(() => {
    const folders = liveFolderStats ?? []
    const tasks = liveTaskStats ?? []
    // undefined (not 0) while stats are missing/failed so the cell stays blank
    const mainCount: FieldStats = {
      columnName: 'name',
      folderCount: liveFolderStats ? totalRowsFromStats(folders) : undefined,
      taskCount: liveTaskStats ? totalRowsFromStats(tasks) : undefined,
    }
    // mergeFieldStats also unifies the duplicate `name` entries field-wise
    return mergeFieldStats([...tasks, mainCount])
  }, [liveFolderStats, liveTaskStats])

  const handleScrollBottomGroupBy = useCallback(
    (groupValue: string) => {
      fetchNextPage(groupValue)
    },
    [fetchNextPage],
  )

  const handleScrollBottom = useCallback(() => {
    if (isLoading) return
    fetchNextPage()
  }, [fetchNextPage, isLoading])

  return (
    <Section style={{ height: '100%' }}>
      <ProjectTreeTable
        scope={scope}
        sliceId={''}
        // pagination
        onScrollBottom={handleScrollBottom}
        onScrollBottomGroupBy={handleScrollBottomGroupBy}
        // metadata
        onOpenNew={onOpenNew}
        clientSorting={showHierarchy || isFlatFolderView}
        showColumnSummaries
        fieldStats={fieldStats}
        groupFieldStats={liveFolderStats}
      />
    </Section>
  )
}

export default ProjectOverviewTable
