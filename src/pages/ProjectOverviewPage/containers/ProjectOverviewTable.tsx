import { useCallback } from 'react'

// UI components
import { Section } from '@ynput/ayon-react-components'

// Components
import { useProjectTableContext, ProjectTreeTable } from '@shared/containers/ProjectTreeTable'
import { useNewEntityContext } from '@context/NewEntityContext'

type Props = {}

const ProjectOverviewTable = ({}: Props) => {
  // the heavy lifting is done in ProjectTableContext and is where the data is fetched
  const { projectName, showHierarchy, isLoading, fetchNextPage } = useProjectTableContext()

  const { onOpenNew } = useNewEntityContext()

  const scope = `overview-${projectName}`

  const fetchMoreOnBottomReached = useCallback(
    (containerRefElement?: HTMLDivElement | null) => {
      if (containerRefElement && !showHierarchy) {
        const { scrollHeight, scrollTop, clientHeight } = containerRefElement
        //once the user has scrolled within 1000px of the bottom of the table, fetch more data if we can
        if (scrollHeight - scrollTop - clientHeight < 1000 && !isLoading) {
          fetchNextPage()
        }
      }
    },
    [fetchNextPage, isLoading, showHierarchy],
  )

  return (
    <Section style={{ height: '100%' }}>
      <ProjectTreeTable
        scope={scope}
        sliceId={''}
        // pagination
        fetchMoreOnBottomReached={fetchMoreOnBottomReached}
        // metadata
        onOpenNew={onOpenNew}
      />
    </Section>
  )
}

export default ProjectOverviewTable
