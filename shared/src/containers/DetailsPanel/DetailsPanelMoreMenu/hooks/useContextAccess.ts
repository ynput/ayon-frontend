import { useVersionUploadContext } from '@shared/components'

export const useContextAccess = () => {
  let onOpenVersionUpload: any = null

  try {
    const versionUploadContext = useVersionUploadContext()
    onOpenVersionUpload = versionUploadContext.onOpenVersionUpload
    console.log('useContextAccess - onOpenVersionUpload available:', !!onOpenVersionUpload)
  } catch (error) {
    console.log('VersionUploadProvider not available in this context:', error)
  }

  return {
    onOpenVersionUpload,
  }
}
