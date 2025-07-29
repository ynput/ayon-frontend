import { forwardRef } from 'react'
import { ViewMenuItem } from '../ViewMenuItem/ViewMenuItem'
import * as Styled from './ViewsMenu.styled'

type Divider = '_divider_' // Represents a divider
type Title = string // Represents a title
type MenuItem = ViewMenuItem | Divider | Title

interface ViewsMenuProps extends React.HTMLAttributes<HTMLUListElement> {
  items: MenuItem[] // Array of ViewMenuItem or string
}

export const ViewsMenu = forwardRef<HTMLUListElement, ViewsMenuProps>(
  ({ items, ...props }, ref) => {
    return (
      <Styled.ViewsMenu {...props} ref={ref}>
        {items.map((item, index) => {
          if (item === '_divider_') {
            return <Styled.ViewsMenuDivider key={index} />
          } else if (typeof item === 'string') {
            return <Styled.ViewsMenuTitle key={index}>{item}</Styled.ViewsMenuTitle>
          } else {
            return <ViewMenuItem key={index} tabIndex={0} {...item} />
          }
        })}
      </Styled.ViewsMenu>
    )
  },
)
