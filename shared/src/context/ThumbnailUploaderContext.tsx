import { createContext, useState } from 'react'

export const ThumbnailUploadContext = createContext<{
  resetFileUploadState?: Function
  triggerThumbnailUpload?: () => void
  triggerVersionUpload?: () => void
  canUploadVersion?: boolean
}>({})

export type ThumbnailUploadProviderProps = {
  handleThumbnailUpload: (thumbnails: any[]) => {}
  entities: any
  thumbnailInputRef: any
  versionsInputRef?: any
  /** Whether version upload is supported for the current selection. Passed explicitly
   *  by the host (EntityPanelUploader) — don't infer from `!!versionsInputRef` because
   *  a ref object is always truthy regardless of whether the input is mounted. */
  canUploadVersion?: boolean
  children?: JSX.Element | JSX.Element[]
}

export const ThumbnailUploadProvider = ({
  children = [],
  thumbnailInputRef,
  versionsInputRef,
  canUploadVersion = false,
}: ThumbnailUploadProviderProps) => {
  const [_, setFileUploadInProgress] = useState(false)
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

  return (
    <ThumbnailUploadContext.Provider
      value={{
        resetFileUploadState,
        triggerThumbnailUpload,
        triggerVersionUpload,
        canUploadVersion,
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
