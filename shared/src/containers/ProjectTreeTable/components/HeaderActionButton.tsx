import { Button, ButtonProps } from '@ynput/ayon-react-components'
import clsx from 'clsx'
import { FC } from 'react'
import styled from 'styled-components'

const ActionButton = styled(Button)`
  width: 24px;
  height: 24px;
  padding: 2px;

  &.action {
    padding: 0px;
    display: flex;
    background-color: unset;
  }

  &:hover {
    background-color: var(--md-sys-color-surface-container-hover) !important;
  }

  &.pin-button .material-symbols-outlined.icon {
    font-variation-settings: 'FILL' 1, 'wght' 200, 'GRAD' 200, 'opsz' 10;
  }

  &.selected {
    display: flex !important;
  }
`

interface HeaderActionButtonProps extends ButtonProps {}

const HeaderActionButton: FC<HeaderActionButtonProps> = ({ selected, style, ...props }) => {
  return (
    <ActionButton
      {...props}
      selected={selected}
      className={clsx(props.className, 'action', { selected })}
      variant="text"
      style={{ ...style }}
    />
  )
}

export default HeaderActionButton
