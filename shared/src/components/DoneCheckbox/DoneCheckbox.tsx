import clsx from 'clsx'
import { Icon, IconProps } from '@ynput/ayon-react-components'
import styled from 'styled-components'

const CheckboxIcon = styled(Icon)`
  cursor: pointer;
  user-select: none;
  font-size: 24px;

  &.checked {
    color: var(--md-sys-color-tertiary);
    /* fill icon */
    font-variation-settings: 'FILL' 1, 'wght' 200, 'GRAD' 200, 'opsz' 20;
  }

  &:not(.readOnly):hover {
    color: var(--md-sys-color-tertiary-hover);
  }

  &.readOnly {
    cursor: default;
  }
`

export interface DoneCheckboxProps extends Omit<IconProps, 'icon'> {
  checked: boolean
  isReadOnly?: boolean
}

export const DoneCheckbox = ({ checked, isReadOnly, ...props }: DoneCheckboxProps) => {
  return (
    <CheckboxIcon
      {...props}
      icon={checked ? 'check_circle' : 'radio_button_unchecked'}
      className={clsx(props.className, { checked, readOnly: isReadOnly })}
    />
  )
}
