import { forwardRef } from 'react'
import * as Styled from './ViewMenuItem.styled'
import { Button, Icon } from '@ynput/ayon-react-components'

export interface ViewMenuItem {
  id: string
  label: string
  startIcon?: string
  isEditable?: boolean
  onEdit?: (e: React.MouseEvent<HTMLButtonElement>) => void
  onClick?: (e: React.MouseEvent<HTMLLIElement>) => void
}

export interface ViewMenuItemProps
  extends Omit<React.LiHTMLAttributes<HTMLLIElement>, 'id'>,
    ViewMenuItem {}

export const ViewMenuItem = forwardRef<HTMLLIElement, ViewMenuItemProps>(
  ({ label, startIcon, isEditable, onEdit, ...props }, ref) => {
    return (
      <Styled.ViewMenuItem {...props} ref={ref}>
        {startIcon && <Icon icon={startIcon} />}
        <span className="label">{label}</span>
        {isEditable && <Styled.MoreButton icon="more_horiz" onClick={onEdit} />}
      </Styled.ViewMenuItem>
    )
  },
)
