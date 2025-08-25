export const useContextAccess = () => {
  let onOpenVersionUpload: any = null

  try {
    const { useVersionUploadContext } = require('@shared/components/VersionUploader/context/VersionUploadContext')
    const versionUploadContext = useVersionUploadContext()
    onOpenVersionUpload = versionUploadContext.onOpenVersionUpload
  } catch (error) {
    console.log('VersionUploadProvider not available in this context:', error)
  }

  return {
    onOpenVersionUpload,
  }
}
