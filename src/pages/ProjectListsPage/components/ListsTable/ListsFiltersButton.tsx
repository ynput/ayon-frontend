import { useListsContext } from '@pages/ProjectListsPage/context/ListsContext'
import { useListsDataContext } from '@pages/ProjectListsPage/context/ListsDataContext'
import { HeaderButton } from '@shared/SimpleTable'
import { ButtonProps } from '@ynput/ayon-react-components'
import clsx from 'clsx'
import { forwardRef } from 'react'
import styled from 'styled-components'

const StyledHeaderButton = styled(HeaderButton)`
  gap: 0;
  &.active {
    background-color: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);

    &:hover {
      background-color: var(--md-sys-color-primary-hover);
    }
  }
`

interface ListsFiltersButtonProps extends ButtonProps {}

export const ListsFiltersButton = forwardRef<HTMLButtonElement, ListsFiltersButtonProps>(
  ({ ...props }, ref) => {
    const { listsFilters, setListsFilters } = useListsDataContext()
    const { setListsFiltersOpen } = useListsContext()
    const hasFilters = listsFilters.length > 0

    return (
      <StyledHeaderButton
        icon={'filter_list'}
        onClick={() => setListsFiltersOpen(true)}
        onContextMenu={(e) => {
          e.preventDefault()
          // clear filters on right click
          if (hasFilters) {
            setListsFilters([])
          } else {
            setListsFiltersOpen(true)
          }
        }}
        className={clsx({ active: hasFilters })}
        data-tooltip={
          hasFilters
            ? `Filters lists (${listsFilters
                .map((f) => f.label)
                .join(', ')}) - Right click to clear`
            : 'Filter lists'
        }
        data-tooltip-delay={200}
        {...props}
        ref={ref}
      >
        {hasFilters ? listsFilters.length : ''}
      </StyledHeaderButton>
    )
  },
)
