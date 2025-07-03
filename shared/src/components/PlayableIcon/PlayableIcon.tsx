import { Icon } from '@ynput/ayon-react-components'
import clsx from 'clsx'
import { forwardRef } from 'react'
import styled from 'styled-components'

const PlayableIconStyled = styled.span`
  position: absolute;
  top: 3px;
  right: 3px;
  z-index: 20;
  --icon-size: 14px;
  width: var(--icon-size);
  height: var(--icon-size);
  pointer-events: none;

  transition: opacity 200ms;

  .icon {
    font-variation-settings: 'FILL' 1, 'wght' 700, 'GRAD' 200, 'opsz' 24;
    font-size: var(--icon-size);
    z-index: 20;
    position: relative;
    color: var(--md-sys-color-outline-variant);
  }

  &::before {
    content: '';
    position: absolute;
    inset: 2px;
    background: var(--md-sys-color-on-surface);
    z-index: 0;
    border-radius: 100%;
  }
`

interface PlayableIconProps extends React.HTMLAttributes<HTMLDivElement> {}

export const PlayableIcon = forwardRef<HTMLDivElement, PlayableIconProps>(
  ({ className, ...props }, ref) => {
    return (
      <PlayableIconStyled className={clsx('playable', className)} {...props} ref={ref}>
        <Icon icon="play_circle" />
      </PlayableIconStyled>
    )
  },
)
