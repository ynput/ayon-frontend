import * as Styled from './FeedFilters.styled'
import { useDispatch, useSelector } from 'react-redux'
import { onDetailsPanelTabChange, onFeedFilterChange } from '/src/features/dashboard'
import { Spacer } from '@ynput/ayon-react-components'
import { classNames } from 'primereact/utils'
import { entitiesWithoutFeed } from '../DetailsPanel'

const FeedFilters = ({ isSlideOut, isLoading, entityType }) => {
  const dispatch = useDispatch()
  const setFeedFilter = (value) => dispatch(onFeedFilterChange({ value, isSlideOut }))
  const setTab = (tab) => dispatch(onDetailsPanelTabChange({ isSlideOut, tab }))

  const filtersStateLocation = isSlideOut ? 'slideOut' : 'details'

  const selectedFilter = useSelector((state) => state.dashboard[filtersStateLocation].filter)
  const selectedTab = useSelector((state) => state.dashboard[filtersStateLocation].tab)

  const filtersLeft = [
    {
      id: 'activity',
      label: 'All activity',
      icon: 'forum',
    },
    {
      id: 'comments',
      label: 'Comments',
      icon: 'chat',
    },
    {
      id: 'checklists',
      label: 'Checklists',
      icon: 'checklist',
    },
    {
      id: 'publishes',
      label: 'Published versions',
      icon: 'layers',
    },
  ]

  const hideActivityFilters = entitiesWithoutFeed.includes(entityType)

  return (
    <Styled.FiltersToolbar className={classNames({ isLoading })}>
      {!hideActivityFilters &&
        filtersLeft.map((filter) => (
          <Styled.FilterButton
            key={filter.id}
            selected={filter.id === selectedFilter && selectedTab === 'feed'}
            onClick={() => setFeedFilter(filter.id)}
            // label={filter.label}
            icon={filter.icon}
            data-tooltip={filter.label}
            data-tooltip-delay={0}
          />
        ))}
      <Spacer />
      {entityType === 'version' && (
        <Styled.FilterButton
          icon="view_in_ar"
          onClick={() => setTab('representations')}
          selected={selectedTab === 'representations'}
          data-tooltip="Representations"
          data-tooltip-delay={0}
        />
      )}
      <Styled.FilterButton
        icon="segment"
        onClick={() => setTab('attribs')}
        selected={selectedTab === 'attribs'}
        data-tooltip="Attributes"
        data-tooltip-delay={0}
      />
    </Styled.FiltersToolbar>
  )
}

export default FeedFilters
