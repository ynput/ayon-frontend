import { useCallback } from 'react'

// UI components
import { Section } from '@ynput/ayon-react-components'

// Components
import {
  useProjectTableContext,
  ProjectTreeTable,
  useColumnSettingsContext,
} from '@shared/containers/ProjectTreeTable'
import { useNewEntityContext } from '@context/NewEntityContext'

type Props = {}

const ProjectOverviewTable = ({}: Props) => {
  // the heavy lifting is done in ProjectTableContext and is where the data is fetched
  const { projectName, showHierarchy, isLoading, fetchNextPage } = useProjectTableContext()
  const { groupBy } = useColumnSettingsContext()

  const { onOpenNew } = useNewEntityContext()

  const scope = `overview-${projectName}`

  // when scrolling to the bottom of the table, we want to fetch more data
  const handleScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const containerRefElement = event.currentTarget
      if (groupBy) {
        // look for a load more button
        const loadMoreButton = containerRefElement?.querySelector('.load-more')
        // get load more button id
        const loadMoreButtonId = loadMoreButton?.getAttribute('id')
        const groupValue = loadMoreButtonId?.split('-')[2] // assuming the id is in the format 'load-more-groupValue'
        if (groupValue) {
          fetchNextPage(groupValue)
        }
      }
    },
    [fetchNextPage, isLoading, showHierarchy, groupBy],
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
        onScroll={handleScroll}
        onScrollBottom={handleScrollBottom}
        // metadata
        onOpenNew={onOpenNew}
        clientSorting={showHierarchy}
      />
    </Section>
  )
}

export default ProjectOverviewTable
