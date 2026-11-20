import { useCallback, useMemo } from 'react'

// UI components
import { Section } from '@ynput/ayon-react-components'

// Components
import {
  useProjectTableContext,
  ProjectTreeTable,
  useAddonTableColumns,
  useTaskColumns,
} from '@shared/containers/ProjectTreeTable'
import type { MainBreakdownFields } from '@shared/containers/ProjectTreeTable'
import { useOptionalNewEntityContext } from '@shared/containers/NewEntity'
import { useProjectContext } from '@shared/context'
import { mergeFieldStats, totalRowsFromStats } from '@shared/api'
import type { FieldStats } from '@shared/api'
import { useProjectOverviewContext } from '../context/project-overview'
import { AddColumnButton } from '@shared/components'
import styled from 'styled-components'

const MAIN_BREAKDOWN_FIELDS: MainBreakdownFields = { primary: 'folderType', secondary: 'taskType' }

const TableWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  /* Section centers its children, which would collapse this box */
  align-self: stretch;
`

type Props = {
  excludedColumns?: string[]
}

const ProjectOverviewTable = ({ excludedColumns }: Props) => {
  const { projectName } = useProjectContext()
  const {
    onLinkColumnsVisibleChange,
    setVisibleEntityIds,
    folderStats,
    taskStats,
    folderStatsLoading,
    taskStatsLoading,
    folderStatsError,
    taskStatsError,
  } = useProjectOverviewContext()
  // the heavy lifting is done in ProjectTableContext and is where the data is fetched
  const { showHierarchy, isFlatFolderView, isLoading, fetchNextPage } = useProjectTableContext()
  // absent outside the project page (an addon's EntityTable)
  const onOpenNew = useOptionalNewEntityContext()?.onOpenNew
  // columns addons contribute (tableColumn slot)
  const { columns: addonColumns, settingsColumns: addonSettingsColumns } =
    useAddonTableColumns('overview')
  // a column per task type, on folder rows (not where the rows are tasks)
  const { columns: taskColumns, settingsColumns: taskSettingsColumns } = useTaskColumns(
    showHierarchy || !!isFlatFolderView,
  )
  // a new array rebuilds the table's columns
  const extraColumns = useMemo(() => [...taskColumns, ...addonColumns], [taskColumns, addonColumns])
  const addColumnItems = useMemo(
    () => [...taskSettingsColumns, ...addonSettingsColumns],
    [taskSettingsColumns, addonSettingsColumns],
  )

  const scope = `overview-${projectName}`

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
      <TableWrapper>
        <ProjectTreeTable
          addonPage="overview"
          scope={scope}
          sliceId={''}
          // pagination
          onScrollBottom={handleScrollBottom}
          onScrollBottomGroupBy={handleScrollBottomGroupBy}
          // metadata
          onOpenNew={onOpenNew}
          clientSorting={showHierarchy || isFlatFolderView}
          onColumnVisibleChangeSubscribed={['link_*']}
          onColumnVisibleChange={onLinkColumnsVisibleChange}
          showColumnSummaries
          fieldStats={fieldStats}
          groupFieldStats={folderStats}
          fieldStatsLoading={folderStatsLoading || taskStatsLoading}
          fieldStatsError={folderStatsError || taskStatsError}
          mainBreakdownFields={MAIN_BREAKDOWN_FIELDS}
          onVisibleRowsChange={setVisibleEntityIds}
          extraColumns={extraColumns}
          excludedColumns={excludedColumns}
        />
        <AddColumnButton extraColumns={addColumnItems} hiddenColumns={excludedColumns} />
      </TableWrapper>
    </Section>
  )
}

export default ProjectOverviewTable
