import { forwardRef, useEffect, useState } from 'react'
import * as Styled from './ListRow.styled'
import { Icon, InputText } from '@ynput/ayon-react-components'
import clsx from 'clsx'

export interface SimpleTableCellTemplateProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
  icon?: string
  count: number
  isRenaming?: boolean
  onSubmitRename?: (value: string) => void // Renamed from onRename
  onCancelRename?: () => void // Renamed from cancelRename
  pt?: {
    value?: React.HTMLAttributes<HTMLSpanElement>
    input?: React.HTMLAttributes<HTMLInputElement> & { value?: string }
  }
}

const ListRow = forwardRef<HTMLDivElement, SimpleTableCellTemplateProps>(
  ({ value, icon, count, isRenaming, onSubmitRename, onCancelRename, pt, ...props }, ref) => {
    // Renamed props
    const [renameValue, setRenameValue] = useState(value)

    useEffect(() => {
      if (isRenaming) {
        setRenameValue(value)
      }
    }, [value, isRenaming])

    return (
      <Styled.Cell {...props} ref={ref}>
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
                onSubmitRename?.(renameValue) // Use onSubmitRename
              }
              if (e.key === 'Escape') {
                onCancelRename?.() // Use onCancelRename
              }
            }}
            onBlur={() => {
              onCancelRename?.() // Use onCancelRename
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
        {!isRenaming && <Styled.ListCount>{count}</Styled.ListCount>}
      </Styled.Cell>
    )
  },
)

export default ListRow
