import { ActivityCategory } from '@shared/api'
import { Dropdown, DropdownProps, StatusField } from '@ynput/ayon-react-components'
import { FC } from 'react'
import { CategoryTag } from './CategoryTag'
import styled from 'styled-components'
import { CategoryDropdownItem } from './CategoryDropdownItem'

const StyledDropdown = styled(Dropdown)`
  button {
    /* remove all styles and just use a wrapper */
    background-color: unset !important;

    /* override the default quill styles */
    padding: 0 !important;
    height: 32px !important;
    width: unset !important;
    color: var(--md-sys-color-on-surface) !important;
  }
`

const StyledItem = styled(StatusField)`
  padding: 12px 8px;
  .status-text {
    margin-left: 0 !important;
  }
`

export interface ActivityCategorySelectProps
  extends Omit<DropdownProps, 'options' | 'value' | 'onChange' | 'valueTemplate'> {
  value?: string | null
  categories: ActivityCategory[]
  readonly?: boolean
  onChange: (value: string) => void
}

export const ActivityCategorySelect: FC<ActivityCategorySelectProps> = ({
  value,
  categories,
  readonly,
  onChange,
  ...props
}) => {
  const category = categories.find((cat) => cat.name === value)
  const { color } = category || {}

  if (readonly) {
    return <CategoryTag value={value} color={color} />
  }

  const options: DropdownProps['options'] = [
    ...(value ? [{ label: 'No category', value: null, color: 'inherit', icon: 'clear' }] : []),
    ...categories.map((cat) => ({
      label: cat.name,
      value: cat.name,
      color: cat.color,
      icon: null,
    })),
  ]

  return (
    <StyledDropdown
      options={options}
      value={value ? [value] : []}
      onChange={(val) => onChange(val[0] as string)}
      valueTemplate={() => <CategoryTag value={value} color={color} />}
      itemTemplate={(option, isActive, isSelected, index) => (
        <CategoryDropdownItem
          label={option.label}
          color={option.color}
          isSelected={isSelected}
          isClear={option.value === null}
          key={index}
        />
      )}
      {...props}
    />
  )
}
