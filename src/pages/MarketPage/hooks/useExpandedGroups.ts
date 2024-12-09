import { useState, useEffect } from 'react'
import { MarketListItem } from '../MarketAddonsList'

interface UseExpandedGroupsProps {
  items: MarketListItem[]
  selected?: string
  filter?: string
}

export const useExpandedGroups = ({ items, selected, filter }: UseExpandedGroupsProps) => {
  const [expandedGroupsMap, setExpandedGroupsMap] = useState<Map<string, string[]>>(new Map())
  const [initialExpandedGroups, setInitialExpandedGroups] = useState<string[]>([])

  const handleSetExpanded = (group: string, filter: string) => {
    setExpandedGroupsMap((prev) => {
      const newMap = new Map(prev)
      const currentGroups = newMap.get(filter) || []
      if (currentGroups.includes(group)) {
        newMap.set(
          filter,
          currentGroups.filter((g) => g !== group),
        )
      } else {
        newMap.set(filter, [...currentGroups, group])
      }
      return newMap
    })
  }

  useEffect(() => {
    if (!filter) return
    // skip if already resolved
    if (initialExpandedGroups.includes(filter)) return
    // skip if placeholder
    if (items.some((i) => i.type === 'placeholder')) return

    if (items.length === 1) {
      console.log(new Map([[filter || '', [items[0].group?.id].filter(Boolean) as string[]]]))
      setExpandedGroupsMap(
        new Map([[filter || '', [items[0].group?.id].filter(Boolean) as string[]]]),
      )
    } else if (selected) {
      const initExpandedGroups = items
        .filter(({ items }) => items?.some(({ name }) => name === selected))
        .map(({ group }) => group?.id)
        .filter(Boolean) as string[]

      setExpandedGroupsMap(new Map([[filter || '', initExpandedGroups]]))
    }
    const newInitialExpandedGroups = [...initialExpandedGroups, filter]
    setInitialExpandedGroups(newInitialExpandedGroups)
  }, [items, selected, initialExpandedGroups, setInitialExpandedGroups, filter])

  const expandedGroups = (filter && expandedGroupsMap.get(filter)) || []

  return { expandedGroups, setExpandedGroups: handleSetExpanded }
}
