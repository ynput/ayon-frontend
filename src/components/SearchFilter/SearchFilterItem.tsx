import { forwardRef } from 'react'
import styled from 'styled-components'
import { Filter } from './types'
import { Button, Icon, theme } from '@ynput/ayon-react-components'
import { SearchFilterItemValue } from './SearchFilterItemValue'

const FilterItem = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  user-select: none;

  background-color: var(--md-sys-color-surface-container-high);
  padding: 2px 4px;
  /* padding-right: 8px; */
  border-radius: 4px;

  cursor: pointer;
  &:hover {
    background-color: var(--md-sys-color-surface-container-high-hover);
  }
`

const Operator = styled.span`
  ${theme.labelSmall}
  display: flex;
  align-items: center;
`

const Remove = styled(Button)`
  border-radius: 50%;

  &:hover {
    background-color: var(--md-sys-color-surface-container-highest-hover);
  }

  &.hasIcon {
    padding: 2px;
  }

  .icon {
    font-size: 16px;
  }
`

interface SearchFilterItemProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'id'>, Filter {
  showOperator?: boolean
  onEdit?: (id: string) => void
  onRemove?: (id: string) => void
}

export const SearchFilterItem = forwardRef<HTMLDivElement, SearchFilterItemProps>(
  (
    { id, label, inverted, values, showOperator, onEdit, onRemove, onClick, icon, ...props },
    ref,
  ) => {
    const handleRemove = (event: React.MouseEvent<HTMLButtonElement>) => {
      // block main onClick event
      event?.stopPropagation()
      // remove filter
      onRemove?.(id)
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      // enter or space
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        event.stopPropagation()
        onEdit && onEdit(id)
      }
    }

    // trigger onEdit callback and forward onClick event
    const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
      onEdit && onEdit(id)
      onClick && onClick(event)
    }

    return (
      <>
        {showOperator && <Operator>{`and ${inverted ? 'not' : ''}`}</Operator>}
        <FilterItem
          id={id}
          {...props}
          ref={ref}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onClick={handleClick}
          className="search-filter-item"
        >
          <Icon icon={inverted ? 'do_not_disturb_on' : 'check_small'} />
          <span className="label">{label}:</span>
          {values?.map((value, index) => (
            <SearchFilterItemValue
              key={(value.value || '') + index}
              {...value}
              showOperator={index > 0}
              isCompact={values.length > 1}
            />
          ))}
          {onRemove && <Remove variant="text" icon="close" onClick={handleRemove} />}
        </FilterItem>
      </>
    )
  },
)
