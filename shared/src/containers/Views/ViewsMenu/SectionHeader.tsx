import { forwardRef } from 'react'
import { Icon } from '@ynput/ayon-react-components'
import * as Styled from './SectionHeader.styled'
import clsx from 'clsx'

export interface SectionHeaderProps extends React.LiHTMLAttributes<HTMLLIElement> {
  id: string
  title: string
  collapsed?: boolean
}

export const SectionHeader = forwardRef<HTMLLIElement, SectionHeaderProps>(
  ({ title, collapsed, className, ...props }, ref) => {
    return (
      <Styled.SectionHeader
        {...props}
        className={clsx('views-section-header', { collapsed }, className)}
        ref={ref}
      >
        <span>{title}</span>
        <span className="spacer" />
        <Icon className="icon" icon={'expand_more'} />
      </Styled.SectionHeader>
    )
  },
)
