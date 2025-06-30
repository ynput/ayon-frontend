import {
  SimpleTableCellTemplate,
  SimpleTableCellTemplateProps,
} from '@shared/SimpleTable/SimpleTableRowTemplate'
import { Icon } from '@ynput/ayon-react-components'
import clsx from 'clsx'
import { FC } from 'react'
import styled from 'styled-components'

const StyledTableRow = styled(SimpleTableCellTemplate)`
  /* on hover - show pin */
  &.selected {
    &:hover {
      .pin {
        display: flex;
      }
    }
  }
`

const StyledPin = styled(Icon)`
  border-radius: var(--border-radius-m);
  padding: var(--padding-s);
  /* default it is not visible and only outline */
  /* on hover we should it (above in StyledTableRow) */
  display: none;

  /* when active, always show and fill */
  &.active {
    display: flex;
    opacity: 0.7;
    font-variation-settings: 'FILL' 1, 'wght' 200, 'GRAD' 200, 'opsz' 20;
  }

  &:hover {
    background-color: var(--md-sys-color-surface-container-highest-hover);
  }
`

interface ProjectsListRowProps extends SimpleTableCellTemplateProps {
  isPinned?: boolean
  onPinToggle?: () => void
}

const ProjectsListRow: FC<ProjectsListRowProps> = ({ isPinned, onPinToggle, ...props }) => {
  return (
    <StyledTableRow
      {...props}
      style={{ paddingRight: 2 }}
      endContent={
        <StyledPin
          icon="push_pin"
          className={clsx('pin', { active: isPinned })}
          onClick={onPinToggle}
        />
      }
    />
  )
}

export default ProjectsListRow
