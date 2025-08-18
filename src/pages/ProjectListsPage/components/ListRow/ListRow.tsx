import { forwardRef, useEffect, useState } from 'react'
import * as Styled from './ListRow.styled'
import { Icon, InputText, Spacer } from '@ynput/ayon-react-components'
import clsx from 'clsx'
import { RowExpander } from '@shared/containers/SimpleTable/SimpleTableRowTemplate'

export interface ListRowProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
  icon?: string
  depth?: number
  count: number | string
  disabled?: boolean
  isRenaming?: boolean
  isTableExpandable?: boolean
  isRowExpandable?: boolean
  isRowExpanded?: boolean
  onSubmitRename?: (value: string) => void
  onCancelRename?: () => void
  onExpandClick?: () => void
  pt?: {
    value?: React.HTMLAttributes<HTMLSpanElement>
    input?: React.HTMLAttributes<HTMLInputElement> & { value?: string }
  }
}

const ListRow = forwardRef<HTMLDivElement, ListRowProps>(
  (
    {
      value,
      depth = 0,
      icon,
      count,
      disabled,
      isRenaming,
      isTableExpandable,
      isRowExpandable,
      isRowExpanded,
      onSubmitRename,
      onCancelRename,
      onExpandClick,
      pt,
      className,
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

    return (
      <Styled.Cell
        {...props}
        className={clsx(className, { disabled })}
        ref={ref}
        style={{
          ...props.style,
          paddingLeft: `calc(${depth * 0.5}rem + 4px)`,
        }}
      >
        <RowExpander
          isRowExpandable={isRowExpandable}
          isRowExpanded={isRowExpanded}
          isTableExpandable={isTableExpandable}
          onExpandClick={onExpandClick}
        />
        {icon && <Icon icon={icon} />}
        {isRenaming ? (
          <InputText
            autoFocus
            {...pt?.input}
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
          <span className={clsx('value', pt?.value?.className)} {...pt?.value}>
            {value}
          </span>
        )}

        {!isRenaming && (
          <>
            <Spacer className="spacer" />
            <Styled.ListCount>{count}</Styled.ListCount>
          </>
        )}
      </Styled.Cell>
    )
  },
)

export default ListRow
