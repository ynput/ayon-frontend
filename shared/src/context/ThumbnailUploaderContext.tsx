import { createContext, ReactNode, RefObject, useState } from 'react'
import { useCreateContextMenu } from '@shared/containers/ContextMenu'

export const ThumbnailUploadContext = createContext<{
  resetFileUploadState?: Function
  triggerThumbnailUpload?: () => void
  triggerVersionUpload?: () => void
  canUploadVersion?: boolean
  onContextMenu?: (event: MouseEvent) => void
}>({})

export type ThumbnailUploadProviderProps = {
  thumbnailInputRef: RefObject<HTMLInputElement>
  versionsInputRef?: RefObject<HTMLInputElement>
  /** Whether version upload is supported for the current selection. Passed explicitly
   *  by the host — don't infer from `!!versionsInputRef` because a ref object is
   *  always truthy regardless of whether the input is mounted. */
  canUploadVersion?: boolean
  children?: ReactNode
}

export const ThumbnailUploadProvider = ({
  children,
  thumbnailInputRef,
  versionsInputRef,
  canUploadVersion = false,
}: ThumbnailUploadProviderProps) => {
  const [, setFileUploadInProgress] = useState(false)
  const [ctxMenuShow] = useCreateContextMenu()
  const resetFileUploadState = () => setFileUploadInProgress(false)

  const triggerThumbnailUpload = () => {
    if (thumbnailInputRef?.current) {
      thumbnailInputRef.current.click()
      setFileUploadInProgress(true)
    }
  }

  const triggerVersionUpload = () => {
    if (versionsInputRef?.current) {
      versionsInputRef.current.click()
      setFileUploadInProgress(true)
    }
  }

  // Right-click on thumbnails opens the same upload actions exposed in the more-menu.
  // Kept after the more-menu refactor because Innders relies on the muscle memory.
  const onContextMenu = (event: MouseEvent) => {
    const items = [
      {
        label: 'Upload thumbnail',
        icon: 'add_photo_alternate',
        command: triggerThumbnailUpload,
      },
      ...(canUploadVersion
        ? [
            {
              label: 'Upload version',
              icon: 'upload',
              command: triggerVersionUpload,
            },
          ]
        : []),
    ]
    // @ts-expect-error - primereact ContextMenu typing
    ctxMenuShow(event, items)
  }

  return (
    <ThumbnailUploadContext.Provider
      value={{
        resetFileUploadState,
        triggerThumbnailUpload,
        triggerVersionUpload,
        canUploadVersion,
        onContextMenu,
      }}
    >
      {children}
    </ThumbnailUploadContext.Provider>
  )
}

export const useThumbnailUploadContext = () => {
  const context = ThumbnailUploadContext
  if (!context) {
    throw new Error('useThumbnailUploadContext must be used within a ThumbnailUploadProvider')
  }
  return context
}
