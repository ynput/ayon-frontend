import { forwardRef, useEffect, useState } from 'react'
import * as Styled from './SimpleTable.styled'
import { Icon, IconProps, InputText, Spacer } from '@ynput/ayon-react-components'
import clsx from 'clsx'

export interface TableRowAction extends IconProps {
  show?: 'always' | 'hover' | 'hidden'
}

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
  badge?: string | React.ReactNode
  actions?: TableRowAction[]
  isRenaming?: boolean
  renameInitialValue?: string
  onSubmitRename?: (value: string) => void
  onCancelRename?: () => void
  renamePlaceholder?: string
  depth?: number
  isDisabled?: boolean
  disabledMessage?: string
  active?: boolean
  inactive?: boolean
  pt?: {
    img?: Partial<React.ImgHTMLAttributes<HTMLImageElement>>
    expander?: Partial<React.ComponentProps<typeof RowExpander>>
    icon?: Partial<React.ComponentProps<typeof Icon>>
    text?: React.HTMLAttributes<HTMLDivElement>
    input?: Partial<React.ComponentProps<typeof InputText>>
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
      badge,
      actions,
      isRenaming,
      renameInitialValue,
      onSubmitRename,
      onCancelRename,
      renamePlaceholder,
      depth = 0,
      isDisabled,
      disabledMessage,
      active,
      inactive,
      style,
      pt,
      ...props
    },
    ref,
  ) => {
    const [renameValue, setRenameValue] = useState(renameInitialValue ?? value)

    useEffect(() => {
      if (isRenaming) {
        setRenameValue(renameInitialValue ?? value)
      }
    }, [value, isRenaming, renameInitialValue])

    return (
      <Styled.Cell
        {...props}
        ref={ref}
        className={clsx(props.className, {
          disabled: isDisabled,
          inactive: inactive || active === false,
          'has-actions': !!actions?.length,
        })}
        style={{
          ...style,
          paddingLeft: `calc(${depth * 1.5}rem + 4px)`,
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
        {isRenaming ? (
          <InputText
            autoFocus
            style={{ flex: 1 }}
            onChange={(e) => setRenameValue(e.target.value)}
            value={renameValue}
            placeholder={renamePlaceholder}
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
            {...pt?.input}
          />
        ) : (
          <div className="text" {...pt?.text}>
            {parents && <span className="path">{parents.join(' / ')} / </span>}
            <span className="value">{value}</span>
          </div>
        )}

        {!isRenaming && (
          <>
            <Spacer className="spacer" />
            {badge && (
              <div className="badges">
                {typeof badge === 'string' ? <span>{badge}</span> : badge}
              </div>
            )}
            {actions && (
              <div className="actions">
                {actions.map((action, i) => {
                  const { show = 'hover', ...iconProps } = action

                  if (show === 'hidden') return null

                  return (
                    <Icon
                      key={iconProps.icon + i.toString()}
                      {...iconProps}
                      className={clsx(iconProps.className, { 'show-always': show === 'always' })}
                    />
                  )
                })}
              </div>
            )}
          </>
        )}
        {endContent && endContent}
      </Styled.Cell>
    )
  },
)
