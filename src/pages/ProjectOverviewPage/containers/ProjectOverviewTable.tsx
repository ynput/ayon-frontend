import { useCallback } from 'react'

// UI components
import { Section } from '@ynput/ayon-react-components'

// Components
import { useProjectTableContext, ProjectTreeTable } from '@shared/containers/ProjectTreeTable'
import { useNewEntityContext } from '@context/NewEntityContext'
import { useProjectContext } from '@shared/context'
import { useProjectOverviewContext } from '../context/ProjectOverviewContext'

type Props = {}

const ProjectOverviewTable = ({}: Props) => {
  const { projectName } = useProjectContext()
  const { setLinksVisible } = useProjectOverviewContext()
  // the heavy lifting is done in ProjectTableContext and is where the data is fetched
  const { showHierarchy, isFlatFolderView, isLoading, fetchNextPage } = useProjectTableContext()

  const { onOpenNew } = useNewEntityContext()

  const scope = `overview-${projectName}`

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
      />
    </Section>
  )
}

export default ProjectOverviewTable
