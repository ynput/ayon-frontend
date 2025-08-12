import { forwardRef } from 'react'
import { Icon } from '@ynput/ayon-react-components'
import * as Styled from './SectionHeader.styled'

export interface SectionHeaderProps extends React.LiHTMLAttributes<HTMLLIElement> {
  id: string
  title: string
  collapsed?: boolean
}

export const SectionHeader = forwardRef<HTMLLIElement, SectionHeaderProps>(
  ({ title, collapsed, ...props }, ref) => {
    return (
      <Styled.SectionHeader {...props} ref={ref}>
        <span>{title}</span>
        <span className="spacer" />
        <Icon className="icon" icon={collapsed ? 'expand_more' : 'expand_less'} />
      </Styled.SectionHeader>
    )
  },
)
