import { createContext, useContext } from 'react'

export const ThumbnailUploadContext = createContext<{
  resetFileUploadState?: Function
  triggerThumbnailUpload?: () => void
  triggerVersionUpload?: () => void
  canUploadVersion?: boolean
  onContextMenu?: (event: MouseEvent) => void
}>({})

export const useThumbnailUploadContext = () => {
  const context = useContext(ThumbnailUploadContext)
  if (!context) {
    throw new Error('useThumbnailUploadContext must be used within a ThumbnailUploadProvider')
  }
  return context
}
