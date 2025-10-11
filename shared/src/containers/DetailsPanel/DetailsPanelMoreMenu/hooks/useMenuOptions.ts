import { useMemo } from 'react'

type SelectedEntityRef = {
  entityId: string
  entityType?: string
}

interface UseMenuOptionsProps {
  onOpenVersionUpload: any
  entityListsContext: any
  entityType: string
  firstEntityData: any
  selectedEntities?: SelectedEntityRef[]
}

interface MenuOptionItem {
  id: string
  label: string
  icon?: string
  command?: () => void
  items?: MenuOptionItem[]
  selected?: boolean
  disabled?: boolean
  hidden?: boolean
}

interface MenuOption {
  value: string
  label: string
  icon: string
  items?: MenuOptionItem[]
}

const stripLeafIcons = (items: MenuOptionItem[]): MenuOptionItem[] =>
  items.map((item) => {
    const childItems = Array.isArray(item.items) ? stripLeafIcons(item.items) : undefined
    const sanitizedItem: MenuOptionItem = {
      ...item,
      ...(childItems ? { items: childItems } : {}),
    }

    if ((!childItems || childItems.length === 0) && sanitizedItem.id !== '__new-list__') {
      const { icon: _icon, ...rest } = sanitizedItem
      return rest
    }

    return sanitizedItem
  })

export const useMenuOptions = ({
  onOpenVersionUpload,
  entityListsContext,
  entityType,
  firstEntityData,
  selectedEntities,
}: UseMenuOptionsProps) => {
  const normalizedSelectedEntities = useMemo(() => {
    if (selectedEntities?.length) {
      return selectedEntities
        .filter((entity) => !!entity?.entityId)
        .map((entity) => ({
          entityId: entity.entityId,
          entityType: entity.entityType || entityType,
        }))
    }

    if (firstEntityData?.id) {
      return [
        {
          entityId: firstEntityData.id,
          entityType: entityType,
        },
      ]
    }

    return []
  }, [selectedEntities, firstEntityData, entityType])

  const ensureNewListItem = (items: MenuOptionItem[], newListItem?: MenuOptionItem | null) => {
    if (!newListItem) return [...items]
    const hasNewList = items.some((item) => item.id === newListItem.id)
    return hasNewList ? [...items] : [...items, newListItem]
  }

  const moreMenuOptions = useMemo((): MenuOption[] => {
    const options: MenuOption[] = [
      {
        value: 'picture-in-picture',
        label: 'Picture in picture',
        icon: 'picture_in_picture',
      },
      {
        value: 'upload-thumbnail',
        label: 'Upload thumbnail',
        icon: 'add_photo_alternate',
      },
    ]

    if (onOpenVersionUpload) {
      options.push({
        value: 'upload-version',
        label: 'Upload version',
        icon: 'upload',
      })
    }

    if (entityListsContext && normalizedSelectedEntities.length) {
      const hasMultipleEntityTypes =
        normalizedSelectedEntities.length > 1 &&
        normalizedSelectedEntities.some(
          (entity) => entity.entityType !== normalizedSelectedEntities[0]?.entityType,
        )

      const targetEntityType =
        (hasMultipleEntityTypes ? undefined : normalizedSelectedEntities[0]?.entityType) ||
        entityType

      const buildMenuItems = (
        lists: any[],
        showIcon?: (list: any) => boolean,
      ): MenuOptionItem[] => {
        if (!entityListsContext.buildHierarchicalMenuItems) return []
        return entityListsContext.buildHierarchicalMenuItems(
          lists,
          normalizedSelectedEntities,
          showIcon,
        )
      }

      let compatibleLists: MenuOptionItem[] = []

      if (hasMultipleEntityTypes) {
        const combinedLists = [
          ...(entityListsContext.folders?.data || []),
          ...(entityListsContext.tasks?.data || []),
        ]
        compatibleLists = buildMenuItems(combinedLists, () => true)
      } else if (targetEntityType === 'folder') {
        compatibleLists = buildMenuItems(entityListsContext.folders?.data || [], () => true)
      } else if (targetEntityType === 'task') {
        compatibleLists = buildMenuItems(entityListsContext.tasks?.data || [], () => true)
      } else if (targetEntityType === 'product') {
        compatibleLists = buildMenuItems(entityListsContext.products?.data || [], () => true)
      } else if (targetEntityType === 'version' || targetEntityType === 'representation') {
        const combinedLists = [
          ...(entityListsContext.versions?.data || []),
          ...(entityListsContext.reviews?.data || []),
        ]
        compatibleLists = buildMenuItems(combinedLists, () => true)
      }

      const shouldAllowNewList =
        targetEntityType === 'folder' ||
        targetEntityType === 'task' ||
        targetEntityType === 'version'

      const newListMenuItem = shouldAllowNewList
        ? entityListsContext.newListMenuItem?.(
            targetEntityType as any,
            normalizedSelectedEntities,
          )
        : undefined

      const combinedItems = ensureNewListItem(compatibleLists, newListMenuItem)
      const sanitizedItems = stripLeafIcons(combinedItems)

      const addToListMenu = entityListsContext.buildAddToListMenu?.(sanitizedItems)

      if (addToListMenu) {
        options.push({
          value: addToListMenu.id,
          label: addToListMenu.label,
          icon: addToListMenu.icon,
          items: addToListMenu.items ? [...addToListMenu.items] : [],
        })
      } else if (sanitizedItems.length > 0) {
        options.push({
          value: 'add-to-list',
          label: 'Add to list',
          icon: 'playlist_add',
          items: sanitizedItems,
        })
      }
    }

    options.push({
      value: 'view-data',
      label: 'View data',
      icon: 'database',
    })

    return options
  }, [
    onOpenVersionUpload,
    entityListsContext,
    entityType,
    firstEntityData,
    normalizedSelectedEntities,
  ])

  return moreMenuOptions
}
