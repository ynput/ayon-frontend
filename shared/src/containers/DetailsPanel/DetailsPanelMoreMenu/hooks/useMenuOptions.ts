import { useMemo } from 'react'

interface UseMenuOptionsProps {
  onOpenVersionUpload: any
  entityListsContext: any
}

export const useMenuOptions = ({ onOpenVersionUpload, entityListsContext }: UseMenuOptionsProps) => {
  const moreMenuOptions = useMemo(() => {
    const options = [
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
      {
        value: 'view-data',
        label: 'View data (raw data)',
        icon: 'database',
      },
    ]

    if (onOpenVersionUpload) {
      options.splice(2, 0, {
        value: 'upload-version',
        label: 'Upload version',
        icon: 'upload',
      })
    }

    if (entityListsContext) {
      options.push({
        value: 'add-to-list',
        label: 'Add to list',
        icon: 'playlist_add',
      })
    }

    return options
  }, [onOpenVersionUpload, entityListsContext])

  return moreMenuOptions
}
