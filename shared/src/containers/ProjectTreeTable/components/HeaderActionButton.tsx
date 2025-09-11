import { Button, ButtonProps } from '@ynput/ayon-react-components'
import clsx from 'clsx'
import { FC } from 'react'
import styled from 'styled-components'

const ActionButton = styled(Button)`
  &.action {
    padding: 0px;
    display: flex;
    background-color: unset;
  }

  &:hover {
    background-color: var(--md-sys-color-surface-container);
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
