import { forwardRef } from 'react'
import { ViewItem } from '../ViewItem/ViewItem'
import * as Styled from './ViewsMenu.styled'
import { SectionHeader } from './SectionHeader'

export const VIEW_DIVIDER = '_divider_' as const // Represents a divider
export type ViewSectionHeader = {
  type: 'section'
  id: string
  title: string
  collapsed?: boolean
  onToggle?: () => void
}
export type ViewMenuItem = ViewItem | typeof VIEW_DIVIDER | ViewSectionHeader

export interface ViewsMenuProps extends React.HTMLAttributes<HTMLUListElement> {
  items: ViewMenuItem[] // Array of ViewMenuItem or string
  selected: string
}

const isSectionHeader = (item: ViewMenuItem): item is ViewSectionHeader =>
  typeof item === 'object' && item !== null && 'type' in item && (item as any).type === 'section'

export const ViewsMenu = forwardRef<HTMLUListElement, ViewsMenuProps>(
  ({ items, selected, ...props }, ref) => {
    return (
      <Styled.Scrollable>
        <Styled.ViewsMenu {...props} ref={ref}>
          {items.map((item, index) => {
            if (item === '_divider_') {
              return <Styled.ViewsMenuDivider key={index} />
            } else if (isSectionHeader(item)) {
              return (
                <SectionHeader
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  collapsed={item.collapsed}
                  onClick={item.onToggle}
                />
              )
            } else {
              return (
                <ViewItem
                  key={(item.id || '') + index.toString()}
                  tabIndex={0}
                  isSelected={item.id === selected}
                  autoFocus={index === 0}
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
