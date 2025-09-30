import { useMemo } from 'react'

interface UseMenuOptionsProps {
  onOpenVersionUpload: any
  entityListsContext: any
  entityType: string
  firstEntityData: any
}

interface MenuOption {
  value: string
  label: string
  icon: string
  items?: Array<{
    id: string
    label: string
    icon?: string
    command: () => void
    selected?: boolean
    disabled?: boolean
  }>
}

export const useMenuOptions = ({ onOpenVersionUpload, entityListsContext, entityType, firstEntityData }: UseMenuOptionsProps) => {
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

    if (entityListsContext && firstEntityData) {
      const selectedEntities = [
        {
          entityId: firstEntityData.id,
          entityType: entityType,
        },
      ]

      let compatibleLists: any[] = []

      if (entityType === 'folder') {
        compatibleLists = (entityListsContext.folders?.data || []).map((list: any) =>
          entityListsContext.buildListMenuItem(list, selectedEntities, false),
        )
      } else if (entityType === 'task') {
        compatibleLists = (entityListsContext.tasks?.data || []).map((list: any) =>
          entityListsContext.buildListMenuItem(list, selectedEntities, false),
        )
      } else if (entityType === 'product') {
        compatibleLists = (entityListsContext.products?.data || []).map((list: any) =>
          entityListsContext.buildListMenuItem(list, selectedEntities, false),
        )
      } else if (entityType === 'version') {
        const hasReviews = (entityListsContext.reviews?.data?.length || 0) > 0
        const versionItems = (entityListsContext.versions?.data || []).map((list: any) =>
          entityListsContext.buildListMenuItem(list, selectedEntities, hasReviews),
        )
        const reviewItems = (entityListsContext.reviews?.data || []).map((list: any) =>
          entityListsContext.buildListMenuItem(list, selectedEntities, true),
        )
        compatibleLists = [...versionItems, ...reviewItems]
      }

      const newListMenuItem = entityListsContext.newListMenuItem(
        entityType as any,
        selectedEntities,
      )

      options.push({
        value: 'add-to-list',
        label: 'Add to list',
        icon: 'playlist_add',
        items: [...compatibleLists, newListMenuItem],
      })
    }

    options.push({
      value: 'view-data',
      label: 'View data',
      icon: 'database',
    })

    return options
  }, [onOpenVersionUpload, entityListsContext, entityType, firstEntityData])

  return moreMenuOptions
}
