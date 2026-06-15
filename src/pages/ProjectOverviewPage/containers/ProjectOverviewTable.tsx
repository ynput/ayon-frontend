import { useCallback, useMemo } from 'react'

// UI components
import { Section } from '@ynput/ayon-react-components'

// Components
import {
  useProjectTableContext,
  useColumnSettingsContext,
  ProjectTreeTable,
} from '@shared/containers/ProjectTreeTable'
import { useNewEntityContext } from '@context/NewEntityContext'
import { useProjectContext, usePowerpack } from '@shared/context'
import { useViewsContext } from '@shared/containers'
import {
  mergeFieldStats,
  buildMetricTargets,
  totalRowsFromStats,
  useGetFolderColumnStatsQuery,
  useGetTaskColumnStatsQuery,
} from '@shared/api'
import type { FieldStats } from '@shared/api'
import { useProjectOverviewContext } from '../context/ProjectOverviewContext'

type Props = {}

const ProjectOverviewTable = ({}: Props) => {
  const { projectName } = useProjectContext()
  const { setLinksVisible } = useProjectOverviewContext()
  // the heavy lifting is done in ProjectTableContext and is where the data is fetched
  const { showHierarchy, isFlatFolderView, isLoading, fetchNextPage, attribFields } =
    useProjectTableContext()
  const { columnVisibility } = useColumnSettingsContext()
  // hold stats queries until views load, otherwise targets cover every column
  const { isLoadingViews } = useViewsContext()
  // column summaries are a powerpack feature — don't fetch stats without a license
  const { powerLicense } = usePowerpack()
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
  const taskStatsFolderIds = useMemo(
    () =>
      statsFolderIds ? Array.from(new Set([...statsFolderIds, ...selectedFolders])) : undefined,
    [statsFolderIds, selectedFolders],
  )

  const { onOpenNew } = useNewEntityContext()

  const scope = `overview-${projectName}`

  const folderTargets = useMemo(
    () => buildMetricTargets({ entity: 'folder', attribs: attribFields, columnVisibility }),
    [attribFields, columnVisibility],
  )
  const taskTargets = useMemo(
    () => buildMetricTargets({ entity: 'task', attribs: attribFields, columnVisibility }),
    [attribFields, columnVisibility],
  )

  const { data: folderStats, isLoading: folderStatsLoading } = useGetFolderColumnStatsQuery(
    {
      projectName,
      filter: folderFilters?.filterString || undefined,
      search: folderFilters?.search || undefined,
      folderIds: statsFolderIds,
      targets: folderTargets,
    },
    { skip: !projectName || isLoadingViews || !powerLicense },
  )
  const { data: taskStats, isLoading: taskStatsLoading } = useGetTaskColumnStatsQuery(
    {
      projectName,
      filter: taskFilters?.filterString || undefined,
      folderFilter: folderFilters?.filterString || undefined,
      search: taskFilters?.search || undefined,
      folderIds: taskStatsFolderIds,
      taskIds: statsTaskIds,
      targets: taskTargets,
    },
    { skip: !projectName || isLoadingViews || !powerLicense },
  )

  const fieldStats = useMemo(() => {
    const folders = folderStats ?? []
    const tasks = taskStats ?? []

    const mainCount: FieldStats = {
      columnName: 'name',
      primaryCount: folderStats ? totalRowsFromStats(folders) : undefined,
      secondaryCount: taskStats ? totalRowsFromStats(tasks) : undefined,
    }
    return mergeFieldStats([...tasks, mainCount])
  }, [folderStats, taskStats])

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
        onColumnVisibleChangeSubscribed={['link_*']}
        onColumnVisibleChange={(changes) => {
          if (Object.values(changes).some((v) => v)) {
            setLinksVisible(true)
          } else {
            setLinksVisible(false)
          }
        }}
        showColumnSummaries
        fieldStats={fieldStats}
        groupFieldStats={folderStats}
        fieldStatsLoading={folderStatsLoading || taskStatsLoading}
      />
    </Section>
  )
}

export default ProjectOverviewTable
