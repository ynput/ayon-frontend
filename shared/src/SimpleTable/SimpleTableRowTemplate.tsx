import { forwardRef } from 'react'
import * as Styled from './SimpleTable.styled'
import { Icon } from '@ynput/ayon-react-components'

export type RowExpanderProps = {
  isRowExpandable?: boolean
  isRowExpanded?: boolean
  isTableExpandable?: boolean
  onExpandClick?: () => void
}

export const RowExpander = ({
  isRowExpandable,
  isRowExpanded,
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
    isTableExpandable && <div style={{ display: 'inline-block', minWidth: 24 }} />
  )

export interface SimpleTableCellTemplateProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
  icon?: string
  iconColor?: string
  isRowExpandable?: boolean
  isRowExpanded?: boolean
  isTableExpandable?: boolean
  onExpandClick?: () => void
  //  when used as a template
  startContent?: React.ReactNode
  endContent?: React.ReactNode
  depth?: number
}

export const SimpleTableCellTemplate = forwardRef<HTMLDivElement, SimpleTableCellTemplateProps>(
  (
    {
      value,
      icon,
      iconColor,
      isRowExpandable,
      isRowExpanded,
      isTableExpandable,
      onExpandClick,
      startContent,
      endContent,
      depth = 0,
      style,
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
      >
        <RowExpander
          isRowExpandable={isRowExpandable}
          isRowExpanded={isRowExpanded}
          isTableExpandable={isTableExpandable}
          onExpandClick={onExpandClick}
        />
        {startContent && startContent}
        {icon && <Icon icon={icon} style={{ color: iconColor }} />}
        <span className="value">{value}</span>
        {endContent && endContent}
      </Styled.Cell>
    )
  },
)
