import { forwardRef, useEffect, useState } from 'react'
import * as Styled from './ProjectsListRow.styled'
import { Icon, IconProps, InputText, Spacer } from '@ynput/ayon-react-components'
import clsx from 'clsx'
import { RowExpander } from '@shared/containers/SimpleTable/SimpleTableRowTemplate'
import { parseProjectFolderRowId } from './buildProjectsTableData'

export interface ProjectsListRowProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
  icon?: string
  iconFilled?: boolean
  iconColor?: string
  depth?: number
  code?: string
  count?: number | string
  disabled?: boolean
  inactive?: boolean
  isRenaming?: boolean
  isTableExpandable?: boolean
  isRowExpandable?: boolean
  isRowExpanded?: boolean
  isPinned?: boolean
  hidePinned?: boolean
  onSubmitRename?: (value: string) => void
  onCancelRename?: () => void
  onExpandClick?: () => void
  onPinToggle?: () => void
  onSettingsClick?: () => void
  pt?: {
    icon?: Partial<IconProps>| undefined;
  }
}

const ProjectsListRow = forwardRef<HTMLDivElement, ProjectsListRowProps>(
  (
    {
      value,
      depth = 0,
      icon,
      iconFilled,
      iconColor,
      code,
      count,
      disabled,
      inactive,
      isRenaming,
      isTableExpandable,
      isRowExpandable,
      isRowExpanded,
      isPinned,
      hidePinned,
      onSubmitRename,
      onCancelRename,
      onExpandClick,
      onPinToggle,
      onSettingsClick,
      pt,
      className,
      id,
      ...props
    },
    ref,
  ) => {
    const [renameValue, setRenameValue] = useState(value)

    useEffect(() => {
      if (isRenaming) {
        setRenameValue(value)
      }
    }, [value, isRenaming])

    // Check if this is a folder row using the canonical folder ID parser
    const isFolder = !!parseProjectFolderRowId(id || '')

    return (
      <Styled.Cell
        {...props}
        className={clsx(className, { disabled, inactive, pinned: isPinned, hidePinned })}
        ref={ref}
        id={id}
        style={{
          ...props.style,
          paddingLeft: `calc(${depth * 2.5}rem + 4px)`,
        }}
      >
        <RowExpander
          isRowExpandable={isRowExpandable}
          isRowExpanded={isRowExpanded}
          isTableExpandable={isTableExpandable}
          onExpandClick={onExpandClick}
          enableNonFolderIndent={false}
        />
        {icon && (
          <Icon
            icon={icon}
            className={clsx('icon', { filled: iconFilled })}
            style={iconColor ? { color: iconColor } : undefined}
          />
        )}
        {isRenaming && isFolder ? (
          <InputText
            autoFocus
            style={{ flex: 1 }}
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
        ) : (
          <span className={clsx('value')}>{value}</span>
        )}

        {!isRenaming && (
          <>
            <Spacer className="spacer" />
            {isFolder ? (
              <Styled.ProjectCount>{count}</Styled.ProjectCount>
            ) : (
              <>
                <Styled.SettingsIcon
                  icon="settings_applications"
                  className="settings-icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    onSettingsClick?.()
                  }}
                />
                <Styled.PinIcon
                  icon="push_pin"
                  className={clsx('pin', { active: isPinned })}
                  onClick={(e) => {
                    e.stopPropagation()
                    onPinToggle?.()
                  }}
                />
                <Styled.Code className="project-code">{code}</Styled.Code>
              </>
            )}
          </>
        )}
      </Styled.Cell>
    )
  },
)

export default ProjectsListRow
