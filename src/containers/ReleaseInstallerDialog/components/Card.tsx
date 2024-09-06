import { forwardRef } from 'react'
import * as Styled from '../ReleaseInstallerDialog.styled'
import { MaterialSymbol } from '@types'
import { Button, Icon } from '@ynput/ayon-react-components'
import clsx from 'clsx'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  subTitle: string
  icon: MaterialSymbol
  isLoading: boolean
  onChange?: () => void
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ title, subTitle, icon, onChange, isLoading, className, ...props }, ref) => {
    return (
      <Styled.Card
        {...props}
        ref={ref}
        className={clsx('shimmer-lightest', className, { loading: isLoading })}
      >
        <Icon icon={icon} />
        <div className="content">
          <div className="title">{title}</div>
          <div className="subTitle">{subTitle}</div>
        </div>
        {onChange && <Button onClick={onChange}>Change</Button>}
      </Styled.Card>
    )
  },
)
