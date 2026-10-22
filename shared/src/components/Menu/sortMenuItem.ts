import type { MenuItemType } from './Menu'

// desc is the direction a field starts in when it is picked
export interface SortMenuOption<T extends string = string> {
  id: T
  label: string
  desc: boolean
}

export interface SortMenuValue<T extends string = string> {
  by: T
  desc: boolean
}

interface SortMenuItemArgs<T extends string> {
  options: SortMenuOption<T>[]
  sort: SortMenuValue<T>
  onChange: (sort: SortMenuValue<T>) => void
  id?: string
  label?: string
  icon?: string
}

// a "Sort" submenu: picking a field selects it, the selected field's end button flips the direction
export const buildSortMenuItem = <T extends string>({
  options,
  sort,
  onChange,
  id = 'sort',
  label = 'Sort',
  icon = 'sort',
}: SortMenuItemArgs<T>): MenuItemType => ({
  id,
  label,
  icon,
  items: options.map((option) => {
    const isSelected = sort.by === option.id
    return {
      id: `${id}-${option.id}`,
      label: option.label,
      onClick: () => onChange({ by: option.id, desc: option.desc }),
      selected: isSelected,
      endActions: isSelected
        ? [
            {
              icon: sort.desc ? 'arrow_downward' : 'arrow_upward',
              tooltip: sort.desc ? 'Descending' : 'Ascending',
              onClick: () => onChange({ ...sort, desc: !sort.desc }),
            },
          ]
        : undefined,
    }
  }),
})
