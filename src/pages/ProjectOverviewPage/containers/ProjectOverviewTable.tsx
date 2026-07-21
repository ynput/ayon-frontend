import { useCallback, useMemo } from 'react'

// UI components
import { Section } from '@ynput/ayon-react-components'

// Components
import { useProjectTableContext, ProjectTreeTable } from '@shared/containers/ProjectTreeTable'
import { useNewEntityContext } from '@shared/containers/NewEntity'
import { useProjectContext } from '@shared/context'
import { mergeFieldStats, totalRowsFromStats } from '@shared/api'
import type { FieldStats } from '@shared/api'
import { useProjectOverviewContext } from '../context/ProjectOverviewContext'

type Props = {}

const ProjectOverviewTable = ({}: Props) => {
  const { projectName } = useProjectContext()
  const {
    setLinksVisible,
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
  const { onOpenNew } = useNewEntityContext()

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
        fieldStatsError={folderStatsError || taskStatsError}
        onVisibleRowsChange={setVisibleEntityIds}
      />
    </Section>
  )
}

export default ProjectOverviewTable
