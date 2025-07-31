import { forwardRef } from 'react'
import { ViewItem } from '../ViewItem/ViewItem'
import * as Styled from './ViewsMenu.styled'
import { SelectedViewState } from '../context/ViewsContext'

export const VIEW_DIVIDER = '_divider_' as const // Represents a divider
type Title = string // Represents a title
export type ViewMenuItem = ViewItem | typeof VIEW_DIVIDER | Title

export interface ViewsMenuProps extends React.HTMLAttributes<HTMLUListElement> {
  items: ViewMenuItem[] // Array of ViewMenuItem or string
  selected: SelectedViewState
}

export const ViewsMenu = forwardRef<HTMLUListElement, ViewsMenuProps>(
  ({ items, selected, ...props }, ref) => {
    return (
      <Styled.Scrollable>
        <Styled.ViewsMenu {...props} ref={ref}>
          {items.map((item, index) => {
            if (item === '_divider_') {
              return <Styled.ViewsMenuDivider key={index} />
            } else if (typeof item === 'string') {
              return <Styled.ViewsMenuTitle key={index}>{item}</Styled.ViewsMenuTitle>
            } else {
              return (
                <ViewItem
                  key={(item.id || '') + index.toString()}
                  tabIndex={0}
                  isSelected={item.id === selected}
                  {...item}
                />
              )
            }
          })}
        </Styled.ViewsMenu>
      </Styled.Scrollable>
    )
  },
)
