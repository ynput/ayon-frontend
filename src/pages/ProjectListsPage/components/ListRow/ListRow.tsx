import { forwardRef } from 'react'
import * as Styled from './ListRow.styled'
import { Icon, InputText } from '@ynput/ayon-react-components'
import clsx from 'clsx'

export interface SimpleTableCellTemplateProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
  icon?: string
  count: number
  isRenaming?: boolean
  pt?: {
    value: React.HTMLAttributes<HTMLSpanElement>
  }
}

const ListRow = forwardRef<HTMLDivElement, SimpleTableCellTemplateProps>(
  ({ value, icon, count, isRenaming, pt, ...props }, ref) => {
    return (
      <Styled.Cell {...props} ref={ref}>
        {icon && <Icon icon={icon} />}
        {isRenaming ? (
          <InputText />
        ) : (
          <span className={clsx('value', pt?.value?.className)} {...pt?.value}>
            {value}
          </span>
        )}
        <Styled.ListCount>{count}</Styled.ListCount>
      </Styled.Cell>
    )
  },
)

export default ListRow
