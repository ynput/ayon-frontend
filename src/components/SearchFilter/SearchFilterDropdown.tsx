import { forwardRef } from 'react'
import { Filter, Option } from './types'
import styled from 'styled-components'
import { Icon } from '@ynput/ayon-react-components'
import clsx from 'clsx'

const OptionsContainer = styled.ul`
  position: absolute;
  top: 40px;
  left: 0;
  right: 0;
  max-height: calc(min(300px, calc(100vh - 100px)));
  overflow: auto;

  display: flex;
  flex-direction: column;
  gap: var(--base-gap-small);

  padding: var(--padding-m);
  margin: 0;

  border-radius: var(--border-radius-l);
  background-color: var(--md-sys-color-surface-container-low);
  border: 1px solid var(--md-sys-color-outline-variant);

  box-shadow: 0px 3px 5px 0px rgba(0, 0, 0, 0.25);
  z-index: 301;
`

const Item = styled.li`
  margin: 0;
  list-style: none;
  cursor: pointer;

  width: 100%;

  display: flex;
  align-items: center;
  gap: var(--base-gap-large);

  padding: 6px;
  border-radius: var(--border-radius-m);

  background-color: var(--md-sys-color-surface-container-low);

  &:hover {
    background-color: var(--md-sys-color-surface-container-hover);
  }

  &.selected {
    background-color: var(--md-sys-color-primary-container);
    &,
    .icon {
      color: var(--md-sys-color-on-primary-container);
    }

    &:hover {
      background-color: var(--md-sys-color-primary-container-hover);
    }
  }

  img {
    width: 20px;
    height: 20px;
    border-radius: 50%;
  }

  .check {
    margin-left: auto;
  }
`

interface SearchFilterDropdownProps {
  options: Option[]
  values: Filter[]
  onSelect: (option: Option) => void
}

const SearchFilterDropdown = forwardRef<HTMLUListElement, SearchFilterDropdownProps>(
  ({ options, values, onSelect }, ref) => {
    const handleSelectOption = (
      event: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>,
    ) => {
      event.preventDefault()
      event.stopPropagation()

      const target = event.target as HTMLElement
      const id = target.closest('li')?.id

      // get option by id
      const option = options.find((option) => option.id === id)
      if (!option) return console.error('Option not found:', id)

      onSelect(option)
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
      // cancel on esc
      if ([' ', 'Enter'].includes(event.key)) {
        event.preventDefault()
        event.stopPropagation()
        handleSelectOption(event)
      }
      // up arrow
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        event.stopPropagation()
        const target = event.target as HTMLElement
        const prev = target.previousElementSibling as HTMLElement
        prev?.focus()
      }
      // down arrow
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        event.stopPropagation()
        const target = event.target as HTMLElement
        const next = target.nextElementSibling as HTMLElement
        next?.focus()
      }
    }

    return (
      <OptionsContainer onKeyDown={handleKeyDown} ref={ref}>
        {options.map(({ id, parentId, label, icon, img, color }) => {
          const isSelected = parentId && getIsValueSelected(id, parentId, values)
          return (
            <Item
              key={id}
              id={id}
              tabIndex={0}
              className={clsx({ selected: isSelected })}
              onClick={(event) => handleSelectOption(event)}
            >
              {icon && <Icon icon={icon} style={{ color: color || undefined }} />}
              {img && <img src={img} alt={label} />}
              <span className="label" style={{ color: color || undefined }}>
                {label}
              </span>
              {isSelected && <Icon icon="check" className="check" />}
            </Item>
          )
        })}
      </OptionsContainer>
    )
  },
)

export default SearchFilterDropdown

const getIsValueSelected = (id: string, parentId: string, values: Filter[]) => {
  // find the parent filter
  const parentFilter = values.find((filter) => filter.id === parentId)
  if (!parentFilter) return false

  // check if the value is already selected
  return parentFilter.values?.some((value) => value.id === id)
}
