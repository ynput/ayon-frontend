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

  &.inactive {
    color: var(--md-sys-color-outline);
  }

  /* by default code is hidden */
  .project-code {
    display: none;
    width: 100%;
    overflow: hidden;
    /* text-overflow: ellipsis; */
  }
  /* reveal code and hide label when smaller than 96px */
  /* pin also becomes smaller */
  container-type: inline-size;
  @container (max-width: 85px) {
    .project-code {
      display: inline-block;
    }
    .value {
      display: none;
    }
    .pin {
      position: absolute;
      top: -4px;
      right: -4px;
      padding: 1px;
      font-size: 14px;
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
  code: string // used when the width is too small to show the full name
  isInActive?: boolean
  isPinned?: boolean
  onPinToggle?: () => void
}

const ProjectsListRow: FC<ProjectsListRowProps> = ({
  code,
  isPinned,
  isInActive,
  onPinToggle,
  className,
  ...props
}) => {
  return (
    <StyledTableRow
      {...props}
      style={{ paddingRight: 2 }}
      className={clsx(className, { inactive: isInActive })}
      startContent={<span className="project-code">{code}</span>}
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
