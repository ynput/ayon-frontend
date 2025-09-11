import { forwardRef, Fragment } from 'react'
import * as Styled from './SimpleTable.styled'
import { Icon } from '@ynput/ayon-react-components'
import clsx from 'clsx'

export type RowExpanderProps = {
  isRowExpandable?: boolean
  isRowExpanded?: boolean
  enableNonFolderIndent?: boolean
  isTableExpandable?: boolean
  onExpandClick?: () => void
}

export const RowExpander = ({
  isRowExpandable,
  isRowExpanded,
  enableNonFolderIndent = true,
  isTableExpandable,
  onExpandClick,
}: RowExpanderProps) =>
  isRowExpandable ? (
    <Styled.Expander
      onClick={(e) => {
        e.stopPropagation()
        onExpandClick?.()
      }}
      icon={isRowExpanded ? 'expand_more' : 'chevron_right'}
      className="expander"
      style={{ cursor: 'pointer' }}
    />
  ) : (
    isTableExpandable &&
    enableNonFolderIndent && <div style={{ display: 'inline-block', minWidth: 24 }} />
  )

export interface SimpleTableCellTemplateProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
  icon?: string
  parents?: string[]
  iconColor?: string
  iconFilled?: boolean
  isRowExpandable?: boolean
  isRowExpanded?: boolean
  isTableExpandable?: boolean
  enableNonFolderIndent?: boolean
  onExpandClick?: () => void
  //  when used as a template
  startContent?: React.ReactNode
  endContent?: React.ReactNode
  depth?: number
  isDisabled?: boolean
  disabledMessage?: string
  active?: boolean
}

export const SimpleTableCellTemplate = forwardRef<HTMLDivElement, SimpleTableCellTemplateProps>(
  (
    {
      value,
      icon,
      parents,
      iconColor,
      iconFilled,
      isRowExpandable,
      isRowExpanded,
      isTableExpandable,
      enableNonFolderIndent = true,
      onExpandClick,
      startContent,
      endContent,
      depth = 0,
      isDisabled,
      disabledMessage,
      active,
      style,
      className,
      ...props
    },
    ref,
  ) => {
    return (
      <Styled.Cell
        {...props}
        ref={ref}
        style={{
          ...style,
          paddingLeft: `calc(${depth * 0.5}rem + 4px)`,
        }}
        title={isDisabled ? disabledMessage : undefined}
      >
        <RowExpander
          isRowExpandable={isRowExpandable}
          isRowExpanded={isRowExpanded}
          isTableExpandable={isTableExpandable}
          onExpandClick={onExpandClick}
          enableNonFolderIndent={enableNonFolderIndent}
        />
        {startContent && startContent}
        {icon && (
          <Icon
            icon={icon}
            className={clsx({ filled: iconFilled })}
            style={{
              color: iconColor,
            }}
          />
        )}
        {parents && (
          <span className="path">
            {parents.map((part, index) => (
              <Fragment key={index}>
                <span key={index + '-path'}>{part}</span>
                <span key={index + '-separator'}>/</span>
              </Fragment>
            ))}
          </span>
        )}
        <span className="value">{value}</span>
        {endContent && endContent}
      </Styled.Cell>
    )
  },
)
