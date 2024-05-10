import * as Styled from './FeedFilters.styled'
import { useDispatch, useSelector } from 'react-redux'
import { onDetailsPanelTabChange, onFeedFilterChange } from '/src/features/dashboard'
import { Spacer } from '@ynput/ayon-react-components'
import { classNames } from 'primereact/utils'

const FeedFilters = ({ isSlideOut, isLoading }) => {
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

  return (
    <Styled.FiltersToolbar className={classNames({ isLoading })}>
      {filtersLeft.map((filter) => (
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
