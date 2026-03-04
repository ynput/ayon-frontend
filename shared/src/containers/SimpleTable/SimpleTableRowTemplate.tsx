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
  img?: string | null
  imgShape?: 'square' | 'circle'
  imgRatio?: number
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
  pt?: {
    img?: Partial<React.ImgHTMLAttributes<HTMLImageElement>>
    expander?: Partial<React.ComponentProps<typeof RowExpander>>
    icon?: Partial<React.ComponentProps<typeof Icon>>
    text?: React.HTMLAttributes<HTMLDivElement>
  }
}

export const SimpleTableCellTemplate = forwardRef<HTMLDivElement, SimpleTableCellTemplateProps>(
  (
    {
      value,
      icon,
      parents,
      iconColor,
      iconFilled,
      img,
      imgShape = 'square',
      imgRatio = 1,
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
      pt,
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
          {...pt?.expander}
        />
        {startContent && startContent}
        {img && (
          <img
            src={img}
            {...pt?.img}
            alt=""
            className={clsx('image', imgShape, pt?.img?.className)}
            style={{
              aspectRatio: imgRatio.toString(),
              ...pt?.img?.style,
            }}
          />
        )}
        {icon && (
          <Icon
            icon={icon}
            className={clsx({ filled: iconFilled }, pt?.icon?.className)}
            style={{
              color: iconColor,
              ...pt?.icon?.style,
            }}
            {...pt?.icon}
          />
        )}
        <div className="text" {...pt?.text}>
          {parents && <span className="path">{parents.join(' / ')} / </span>}
          <span className="value">{value}</span>
        </div>
        {endContent && endContent}
      </Styled.Cell>
    )
  },
)
