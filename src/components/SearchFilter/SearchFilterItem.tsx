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

    .button {
      background-color: var(--md-sys-color-surface-container-highest-hover);
    }
  }
`

const Operator = styled.span`
  ${theme.labelSmall}
  display: flex;
  align-items: center;
`

const ChipButton = styled(Button)`
  border-radius: 50%;
  background-color: unset;

  &:hover {
    &.button {
      background-color: var(--md-sys-color-primary);
    }
    .icon {
      color: var(--md-sys-color-on-primary);
    }
  }

  &.hasIcon {
    padding: 2px;
  }

  .icon {
    font-size: 16px;
  }
`

interface SearchFilterItemProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'id'>, Filter {
  index?: number
  onEdit?: (id: string) => void
  onRemove?: (id: string) => void
  onInvert?: (id: string) => void
}

export const SearchFilterItem = forwardRef<HTMLDivElement, SearchFilterItemProps>(
  (
    {
      id,
      label,
      inverted,
      values,
      icon,
      isCustom,
      index,
      onEdit,
      onRemove,
      onInvert,
      onClick,
      ...props
    },
    ref,
  ) => {
    const handleRemove = (event: React.MouseEvent<HTMLButtonElement>) => {
      // block main onClick event
      event?.stopPropagation()
      // remove filter
      onRemove?.(id)
    }

    const handleInvert = (event: React.MouseEvent<HTMLButtonElement>) => {
      // block main onClick event
      event?.stopPropagation()
      // remove filter
      onInvert?.(id)
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

    const operatorText = getOperatorText(index || 0, inverted)

    return (
      <>
        {operatorText && <Operator>{operatorText}</Operator>}
        <FilterItem
          id={id}
          {...props}
          ref={ref}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onClick={handleClick}
          className="search-filter-item"
        >
          <ChipButton
            className="button"
            icon={inverted ? 'do_not_disturb_on' : 'check_small'}
            onClick={handleInvert}
            data-tooltip={'include/exclude'}
          />
          <span className="label">{label}:</span>
          {values?.map((value, index) => (
            <SearchFilterItemValue
              key={(value.id || '') + index}
              id={value.id}
              label={value.label}
              img={value.img}
              icon={value.icon}
              color={value.color}
              isCustom={value.isCustom}
              showOperator={index > 0}
              isCompact={values.length > 1 && (!!value.icon || !!value.img)}
            />
          ))}
          {onRemove && <ChipButton className="button" icon="close" onClick={handleRemove} />}
        </FilterItem>
      </>
    )
  },
)

const getOperatorText = (index: number, inverted?: boolean): string | undefined => {
  if (index > 0) {
    return `and ${inverted ? 'not' : ''}`
  } else if (inverted) {
    return 'not'
  } else {
    return undefined
  }
}
