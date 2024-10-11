import { forwardRef } from 'react'
import styled from 'styled-components'
import { Filter } from './types'
import { Icon, theme } from '@ynput/ayon-react-components'
import { SearchFilterItemValue } from './SearchFilterItemValue'

const FilterItem = styled.div`
  display: flex;
  gap: var(--base-gap-large);

  background-color: var(--md-sys-color-surface-container-high);
  padding: 2px 4px;
  padding-right: 8px;
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

interface SearchFilterItemProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'id'>, Filter {
  showOperator?: boolean
}

export const SearchFilterItem = forwardRef<HTMLDivElement, SearchFilterItemProps>(
  ({ id, label, inverted, values, showOperator, ...props }, ref) => {
    return (
      <>
        {showOperator && <Operator>{`and ${inverted ? 'not' : ''}`}</Operator>}
        <FilterItem id={id} {...props} ref={ref}>
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
        </FilterItem>
      </>
    )
  },
)
