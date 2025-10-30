import { useCallback, useMemo, MouseEvent, RefObject } from 'react'
import ContextMenuItem, { ContextMenuItemProps } from './ContextMenuItem'
import { useContextMenu } from './ContextMenuContext'
import { PowerpackContextType, PowerpackFeature } from '@shared/context'

// Extend the item type based on the ContextMenuItemProps
export interface ContextMenuItemType extends Omit<ContextMenuItemProps, 'contextMenuRef'> {
  items?: ContextMenuItemType[]
  template?: React.ReactNode
  [key: string]: any
}

// This is used to create submenus
const addTemplateToItems = (
  items: ContextMenuItemType[],
  ref: RefObject<{ hide: () => void }>,
  power: {
    powerLicense?: boolean
    setPowerpackDialog?: (feature: PowerpackFeature | null) => void
  },
): ContextMenuItemType[] => {
  return items.map((item) => {
    const newItem: ContextMenuItemType = {
      ...item,
      template: (
        <ContextMenuItem
          key={item.label}
          contextMenuRef={ref}
          {...item}
          powerLicense={power.powerLicense}
          onPowerClick={power.setPowerpackDialog}
        />
      ),
    }
    if (newItem.items) {
      newItem.items = addTemplateToItems(newItem.items, ref, power)
    }
    return newItem
  })
}

type UseCreateContextReturn = [
  (e: MouseEvent, newItems?: ContextMenuItemType[]) => void,
  () => void,
  boolean,
  RefObject<{ hide: () => void }>,
]

export const useCreateContextMenu = (
  menuList: ContextMenuItemType[] = [],
  powerConfig?: Pick<PowerpackContextType, 'powerLicense' | 'setPowerpackDialog'>,
): UseCreateContextReturn => {
  const { openContext, ref, isContextOpen, closeContext } = useContextMenu()
  const { powerLicense, setPowerpackDialog } = powerConfig || {}

  const getModel = useCallback(
    (
      menuList: ContextMenuItemType[],
      ref: RefObject<{ hide: () => void }>,
    ): ContextMenuItemType[] => {
      return menuList.filter(Boolean).map((item) => ({
        template: (
          <ContextMenuItem
            key={item.label}
            contextMenuRef={ref}
            {...item}
            powerLicense={powerLicense}
            onPowerClick={setPowerpackDialog}
          />
        ),
        items: item.items?.length
          ? addTemplateToItems(item.items, ref, { powerLicense, setPowerpackDialog })
          : undefined,
      }))
    },
    [powerLicense, setPowerpackDialog],
  )

  const model = useMemo(() => getModel(menuList, ref), [menuList, ref, getModel])

  const handleOpen = (e: MouseEvent, newItems?: ContextMenuItemType[]): void => {
    if (!e || !ref.current) return console.error('No ref or event passed to openContext')

    let newModel
    if (newItems) {
      newModel = getModel(newItems, ref)
    }

    e.preventDefault()
    openContext(e, newModel || model)
  }

  return [handleOpen, closeContext, isContextOpen, ref]
}

export default useCreateContextMenu
