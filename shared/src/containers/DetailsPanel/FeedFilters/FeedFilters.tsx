import * as Styled from './FeedFilters.styled'
import { Button, Spacer } from '@ynput/ayon-react-components'
import clsx from 'clsx'
import { entitiesWithoutFeed } from '../DetailsPanel'
import { DetailsPanelEntityType } from '@shared/api'
import { DetailsPanelTab } from '@shared/context'

const filtersLeft: {
  id: DetailsPanelTab
  label?: string
  tooltip: string
  icon: string
}[] = [
  {
    id: 'activity',
    tooltip: 'All activity',
    icon: 'forum',
  },
  {
    id: 'comments',
    tooltip: 'Comments',
    icon: 'chat',
  },
  {
    id: 'versions',
    tooltip: 'Published versions',
    icon: 'layers',
  },
  {
    id: 'checklists',
    tooltip: 'Checklists',
    icon: 'checklist',
  },
]

export interface FeedFiltersProps extends React.HTMLAttributes<HTMLDivElement> {
  isLoading?: boolean
  entityType: DetailsPanelEntityType
  overrides?: Record<string, any>
  currentTab: DetailsPanelTab
  onTabChange: (tab: DetailsPanelTab) => void
}

const FeedFilters = ({
  isLoading,
  entityType,
  className,
  overrides = {},
  currentTab,
  onTabChange,
  ...props
}: FeedFiltersProps) => {
  // for each override, find the filter and update it
  Object.entries(overrides).forEach(([id, override]) => {
    const index = filtersLeft.findIndex((filter) => filter.id === id)
    if (index !== -1) {
      filtersLeft[index] = { ...filtersLeft[index], ...override }
    }
  })

  const hideActivityFilters = entitiesWithoutFeed.includes(entityType)

  return (
    <Styled.FiltersToolbar {...props} className={clsx(className, { loading: isLoading })}>
      {!hideActivityFilters &&
        filtersLeft.map((filter) => (
          <Button
            key={filter.id}
            selected={filter.id === currentTab}
            onClick={() => onTabChange(filter.id)}
            label={filter.label}
            icon={filter.icon}
            data-tooltip={filter.tooltip}
            data-tooltip-delay={0}
          />
        ))}
      <Spacer />
      {entityType === 'version' && (
        <Button
          icon="order_play"
          onClick={() => onTabChange('files')}
          selected={currentTab === 'files'}
          data-tooltip="Version files"
          data-tooltip-delay={0}
        />
      )}
      <Button
        onClick={() => onTabChange('details')}
        selected={currentTab === 'details'}
        style={{ padding: '6px 8px' }}
      >
        Details
      </Button>
    </Styled.FiltersToolbar>
  )
}

export default FeedFilters
