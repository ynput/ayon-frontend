import { forwardRef, ReactNode } from 'react'
import * as Styled from './ViewItem.styled'
import clsx from 'clsx'

export interface ViewItem {
  id: string
  label: string
  startContent?: ReactNode
  endContent?: ReactNode
  isSelected?: boolean
  isEditable?: boolean
  isPersonal?: boolean
  onEdit?: (e: React.MouseEvent<HTMLButtonElement>) => void
  onClick?: (e: React.MouseEvent<HTMLLIElement>) => void
}

export interface ViewMenuItemProps
  extends Omit<React.LiHTMLAttributes<HTMLLIElement>, 'id'>,
    ViewItem {}

export const ViewItem = forwardRef<HTMLLIElement, ViewMenuItemProps>(
  (
    {
      label,
      startContent,
      endContent,
      isSelected,
      isEditable,
      isPersonal,
      onEdit,
      className,
      ...props
    },
    ref,
  ) => {
    return (
      <Styled.ViewItem
        {...props}
        className={clsx(className, { selected: isSelected, personal: isPersonal })}
        ref={ref}
      >
        {startContent && startContent}
        <span className="label">{label}</span>
        {isEditable && (
          <Styled.MoreButton variant="text" icon="more_horiz" className="more" onClick={onEdit} />
        )}
        {endContent && endContent}
      </Styled.ViewItem>
    )
  },
)
