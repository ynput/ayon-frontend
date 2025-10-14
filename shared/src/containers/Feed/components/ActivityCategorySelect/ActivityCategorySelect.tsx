import { ActivityCategory } from '@shared/api'
import { Dropdown, DropdownProps, StatusField } from '@ynput/ayon-react-components'
import { FC } from 'react'
import { CategoryTag } from './CategoryTag'
import styled from 'styled-components'
import { CategoryDropdownItem } from './CategoryDropdownItem'
import { PowerpackFeature } from '@shared/context'
import { toast } from 'react-toastify'

export const isCategoryHidden = (
  categories: ActivityCategory[],
  { isGuest, isUser }: { isGuest?: boolean; isUser: boolean },
) => {
  // guest can never see categories. They create comments with categories but cannot see them
  if (isGuest) return true
  // if there are no categories a regular user has access to, hide the category select
  if (!categories.length && isUser) return true
  // admins always see the category select, even if there are no categories
  return false
}

const CATEGORY_PP_MIN_VERSION = '1.3.0'

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

export interface ActivityCategorySelectProps
  extends Omit<DropdownProps, 'options' | 'value' | 'onChange' | 'valueTemplate'> {
  value?: string | null
  categories: ActivityCategory[]
  readonly?: boolean
  isHidden?: boolean
  isCompact?: boolean
  hasPowerpack?: boolean
  onPowerFeature?: (feature: PowerpackFeature) => void
  onChange: (value: string) => void
}

export const ActivityCategorySelect: FC<ActivityCategorySelectProps> = ({
  value,
  categories,
  readonly,
  isHidden,
  isCompact,
  hasPowerpack,
  onPowerFeature,
  onChange,
  ...props
}) => {
  if (isHidden) return null

  const category = categories.find((cat) => cat.name === value)
  const { color } = category || {}

  if (!hasPowerpack) {
    return (
      <CategoryTag
        value={null}
        isPower
        isDisabled
        style={props.style}
        onClick={() => onPowerFeature?.('commentCategories')}
        data-tooltip={'Comment categories is a Powerpack feature'}
      />
    )
  }

  if (readonly) {
    return <CategoryTag value={value} color={color} isCompact={isCompact} style={props.style} />
  }

  if (!categories.length) {
    return (
      <CategoryTag
        value={value}
        color={color}
        isCompact={isCompact}
        style={props.style}
        onClick={() =>
          toast.warning(
            `No categories found. Ensure they are set in the Powerpack settings and the version is at least ${CATEGORY_PP_MIN_VERSION}.`,
          )
        }
      />
    )
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
      valueTemplate={() => (
        <CategoryTag value={value} color={color} isCompact={isCompact} isEditing />
      )}
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
