import { useCallback, useMemo } from 'react'

// UI components
import { Section } from '@ynput/ayon-react-components'

// Components
import {
  useProjectTableContext,
  useColumnSettingsContext,
  ProjectTreeTable,
  applySliceSummaryDefault,
} from '@shared/containers/ProjectTreeTable'
import { useNewEntityContext } from '@context/NewEntityContext'
import { useProjectContext, usePowerpack } from '@shared/context'
import { useViewsContext, useSlicerContext } from '@shared/containers'
import {
  mergeFieldStats,
  buildMetricTargets,
  shouldSkipColumnStats,
  totalRowsFromStats,
  useGetFolderColumnStatsQuery,
  useGetTaskColumnStatsQuery,
} from '@shared/api'
import type { FieldStats } from '@shared/api'
import { useProjectOverviewContext } from '../context/ProjectOverviewContext'

type Props = {}

const ProjectOverviewTable = ({}: Props) => {
  const { projectName } = useProjectContext()
  const { setLinksVisible, setVisibleEntityIds } = useProjectOverviewContext()
  // the heavy lifting is done in ProjectTableContext and is where the data is fetched
  const { showHierarchy, isFlatFolderView, isLoading, fetchNextPage, attribFields } =
    useProjectTableContext()
  const {
    columnVisibility,
    defaultColumnVisibility,
    columnSummaries,
    columnSummaryScopes,
    groupByConfig,
  } = useColumnSettingsContext()
  // active slicer auto-enables its matching column's default summary
  const { sliceType } = useSlicerContext()
  const effectiveColumnSummaries = useMemo(
    () => applySliceSummaryDefault(columnSummaries, columnSummaryScopes, sliceType),
    [columnSummaries, columnSummaryScopes, sliceType],
  )
  // hold stats queries until views load, otherwise targets cover every column
  const { isLoadingViews } = useViewsContext()
  // column summaries are a powerpack feature — don't fetch stats without a license
  const { powerLicense } = usePowerpack()
  // skip the query only when the name count and every other summary are off
  const noSummaries = shouldSkipColumnStats(
    effectiveColumnSummaries,
    columnSummaryScopes,
    columnVisibility,
    defaultColumnVisibility,
  )
  const { folderFilters, taskFilters, selectedFolders, selectedTaskIds } =
    useProjectOverviewContext()

  // Mirror the task list query: slicer selection narrows rows to the selected
  // subtree (foldersMap is already subtree-filtered when a slice is active);
  // an entity-list task selection takes precedence over folder ids.
  const statsTaskIds = selectedTaskIds.length ? selectedTaskIds : undefined

  const { onOpenNew } = useNewEntityContext()

  const scope = `overview-${projectName}`

  const folderTargets = useMemo(
    () =>
      buildMetricTargets({
        entity: 'folder',
        attribs: attribFields,
        columnVisibility,
        defaultColumnVisibility,
        columnSummaries: effectiveColumnSummaries,
        columnSummaryScopes,
      }),
    [
      attribFields,
      columnVisibility,
      defaultColumnVisibility,
      effectiveColumnSummaries,
      columnSummaryScopes,
    ],
  )
  const taskTargets = useMemo(
    () =>
      buildMetricTargets({
        entity: 'task',
        attribs: attribFields,
        columnVisibility,
        defaultColumnVisibility,
        columnSummaries: effectiveColumnSummaries,
        columnSummaryScopes,
      }),
    [
      attribFields,
      columnVisibility,
      defaultColumnVisibility,
      effectiveColumnSummaries,
      columnSummaryScopes,
    ],
  )

  const {
    data: folderStats,
    isLoading: folderStatsLoading,
    error: folderStatsError,
  } = useGetFolderColumnStatsQuery(
    {
      projectName,
      filter: folderFilters?.filterString || undefined,
      taskFilter: taskFilters?.filterString || undefined,
      search: folderFilters?.search || undefined,
      // show hierarchy never includes it self and only children
      [showHierarchy ? 'parentIds' : 'ids']: selectedFolders?.length ? selectedFolders : undefined,
      targets: folderTargets,
      // always count all children, for grouping by folder this is a flat list. For hierarchy this is confusing AF as some folders will be hidden
      includeFolderChildren: true,
      // when grouping by folder, not having having "show empty" enabled means we do not count empty folder
      hideEmptyFolders: groupByConfig?.showEmpty === false && !showHierarchy ? true : undefined,
    },
    { skip: !projectName || isLoadingViews || !powerLicense || noSummaries },
  )

  const {
    data: taskStats,
    isLoading: taskStatsLoading,
    error: taskStatsError,
  } = useGetTaskColumnStatsQuery(
    {
      projectName,
      filter: taskFilters?.filterString || undefined,
      folderFilter: folderFilters?.filterString || undefined,
      search: taskFilters?.search || undefined,
      folderIds: selectedFolders?.length ? selectedFolders : undefined,
      taskIds: statsTaskIds,
      targets: taskTargets,
    },
    { skip: !projectName || isLoadingViews || !powerLicense || noSummaries },
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
        sliceType={sliceType}
        fieldStats={fieldStats}
        groupFieldStats={folderStats}
        fieldStatsLoading={folderStatsLoading || taskStatsLoading}
        fieldStatsError={folderStatsError || taskStatsError}
        onVisibleRowsChange={setVisibleEntityIds}
      />
    </Section>
  )
}

export default ProjectOverviewTable
