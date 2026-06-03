import { useCallback, useMemo } from 'react'

// UI components
import { Section } from '@ynput/ayon-react-components'

// Components
import { useProjectTableContext, ProjectTreeTable } from '@shared/containers/ProjectTreeTable'
import { mockFieldStats, mergeFieldStats } from '@shared/containers/ProjectTreeTable'
import { useNewEntityContext } from '@context/NewEntityContext'
import { useProjectContext } from '@shared/context'
import { useGetFolderColumnStatsQuery } from '@shared/api'
import { useProjectOverviewContext } from '../context/ProjectOverviewContext'

type Props = {}

const ProjectOverviewTable = ({}: Props) => {
  const { projectName } = useProjectContext()
  // the heavy lifting is done in ProjectTableContext and is where the data is fetched
  const { showHierarchy, isFlatFolderView, isLoading, fetchNextPage } = useProjectTableContext()
  const { folderFilters } = useProjectOverviewContext()

  const { onOpenNew } = useNewEntityContext()

  const scope = `overview-${projectName}`

  // Live folder stats (backend folders.fieldStats) merged with mock — live values
  // win, mock fills the columns/fields the backend doesn't return yet.
  const { data: liveFieldStats } = useGetFolderColumnStatsQuery(
    {
      projectName,
      filter: folderFilters?.filterString || undefined,
      search: folderFilters?.search || undefined,
    },
    { skip: !projectName },
  )
  const fieldStats = useMemo(
    () => mergeFieldStats(liveFieldStats, mockFieldStats),
    [liveFieldStats],
  )

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
      />
    </Section>
  )
}

export default ProjectOverviewTable
