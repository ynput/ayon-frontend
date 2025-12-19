import {
  SimpleTableCellTemplate,
  SimpleTableCellTemplateProps,
} from '@shared/containers/SimpleTable/SimpleTableRowTemplate'
import { Icon, InputText } from '@ynput/ayon-react-components'
import clsx from 'clsx'
import { FC, useState } from 'react'
import styled from 'styled-components'
import { parseProjectFolderRowId } from './buildProjectsTableData'

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
const StyledProjectCount = styled.span`
  color: var(--md-sys-color-outline);
  padding-right: 4px;
`

interface ProjectsListRowProps extends SimpleTableCellTemplateProps {
  code?: string // used when the width is too small to show the full name
  isInActive?: boolean
  isPinned?: boolean
  onPinToggle?: () => void
  data?: any // row data object
  isRenaming?: boolean
  onSubmitRename?: (name: string) => void
  onCancelRename?: () => void
  count?: number
}

const ProjectsListRow: FC<ProjectsListRowProps> = ({
  code,
  isPinned,
  isInActive,
  onPinToggle,
  className,
  data,
  depth,
  isTableExpandable,
  isRowExpandable,
  isRowExpanded,
  onExpandClick,
  isRenaming,
  onSubmitRename,
  onCancelRename,
  count,
  ...props
}) => {
  // Check if this is a folder row using the canonical folder ID parser
  const isFolder = !!parseProjectFolderRowId(props.id || '')
  const [renameValue, setRenameValue] = useState(props.value || '')

  if (isFolder && isRenaming) {
    return (
      <InputText
        autoFocus
        style={{ flex: 1, marginLeft: 20 }}
        onChange={(e) => setRenameValue(e.target.value)}
        value={renameValue}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onSubmitRename?.(renameValue)
          }
          if (e.key === 'Escape') {
            onCancelRename?.()
          }
        }}
        onBlur={() => {
          onCancelRename?.()
        }}
        onFocus={(e) => {
          e.target.select()
        }}
      />
    )
  }

  return (
    <StyledTableRow
      {...props}
      depth={depth}
      isTableExpandable={isTableExpandable}
      isRowExpandable={isRowExpandable}
      isRowExpanded={isRowExpanded}
      onExpandClick={onExpandClick}
      style={{ paddingRight: 2 }}
      className={clsx(className, { inactive: isInActive })}
      startContent={!isFolder && code ? <span className="project-code">{code}</span> : undefined}
      endContent={

        !isFolder ? (
          <StyledPin
            icon="push_pin"
            className={clsx('pin', { active: isPinned })}
            onClick={onPinToggle}
          />
        ) :  <StyledProjectCount>{count}</StyledProjectCount>
      }
    />
  )
}

export default ProjectsListRow
