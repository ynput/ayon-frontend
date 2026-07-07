import { forwardRef } from 'react'
import clsx from 'clsx'
import {
  SimpleTableCellTemplate,
  SimpleTableCellTemplateProps,
  TableRowAction,
} from '@shared/containers/SimpleTable/SimpleTableRowTemplate'
import { parseProjectFolderRowId } from './buildProjectsTableData'

export interface ProjectsListRowProps extends SimpleTableCellTemplateProps {
  code?: string
  count?: number | string
  isPinned?: boolean
  hidePinned?: boolean
  onPinToggle?: () => void
  onSettingsClick?: () => void
}

const ProjectsListRow = forwardRef<HTMLDivElement, ProjectsListRowProps>(
  ({ code, count, isPinned, onPinToggle, onSettingsClick, id, className, ...props }, ref) => {
    // Check if this is a folder row using the canonical folder ID parser
    const isFolder = !!parseProjectFolderRowId(id || '')

    const hoverActions: TableRowAction[] = !isFolder
      ? [
          {
            icon: 'settings_applications',
            className: 'settings-icon',
            onClick: (e) => {
              e.stopPropagation()
              onSettingsClick?.()
            },
          },
          {
            icon: 'push_pin',
            className: clsx('pin', { active: isPinned }),
            show: isPinned ? 'always' : 'hover',
            onClick: (e) => {
              e.stopPropagation()
              onPinToggle?.()
            },
          },
        ]
      : []

    return (
      <SimpleTableCellTemplate
        {...props}
        className={clsx(className, { pinned: isPinned, hidePinned: props.hidePinned })}
        ref={ref}
        id={id}
        enableNonFolderIndent={false}
        renamePlaceholder={!isFolder ? 'Project label' : undefined}
        hoverActions={hoverActions}
        badge={isFolder ? count : code}
      />
    )
  },
)

export default ProjectsListRow
