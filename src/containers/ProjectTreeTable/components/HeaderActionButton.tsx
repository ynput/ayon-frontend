import { Button, ButtonProps } from '@ynput/ayon-react-components'
import clsx from 'clsx'
import { FC } from 'react'
import styled from 'styled-components'

const ActionButton = styled(Button)`
  padding: 0px !important;
  display: none;
  background-color: var(--md-sys-color-surface-container-lowest);

  &.selected {
    display: flex;
  }
`

interface HeaderActionButtonProps extends ButtonProps {
  order: number
}

const HeaderActionButton: FC<HeaderActionButtonProps> = ({ selected, order, style, ...props }) => {
  return (
    <ActionButton
      {...props}
      selected={selected}
      className={clsx(props.className, 'action', { selected })}
      variant="text"
      style={{ ...style, order: selected ? order : 'initial' }}
    />
  )
}

export default HeaderActionButton
