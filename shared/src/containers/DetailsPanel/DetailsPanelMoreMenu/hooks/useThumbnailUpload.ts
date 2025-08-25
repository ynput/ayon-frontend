import { toast } from 'react-toastify'

interface UseThumbnailUploadProps {
  entityType: string
  firstEntityData: any
  firstProject: string
  refetch: () => Promise<any>
}

export const useThumbnailUpload = ({
  entityType,
  firstEntityData,
  firstProject,
  refetch,
}: UseThumbnailUploadProps) => {
  const handleUploadThumbnail = async (file: File) => {
    if (!file || !firstEntityData || !firstProject) return

    try {
      if (!file.type.includes('image')) {
        throw new Error('Invalid file format. Please select an image file.')
      }

      const response = await fetch(
        `/api/projects/${firstProject}/${entityType}s/${firstEntityData.id}/thumbnail`,
        {
          method: 'POST',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        },
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        let errorMessage = errorData.message || `Failed to upload thumbnail (${response.status})`

        if (response.status === 415) {
          errorMessage =
            'Unsupported file format. Please select a valid image file (JPEG, PNG, etc.).'
        } else if (response.status === 413) {
          errorMessage = 'File too large. Please select a smaller image file.'
        } else if (response.status === 401) {
          errorMessage = 'Unauthorized. Please check your permissions.'
        } else if (response.status === 403) {
          errorMessage = 'Access denied. You do not have permission to upload thumbnails.'
        }

        throw new Error(errorMessage)
      }

      toast.success('Thumbnail uploaded successfully')
      if (refetch) {
        try {
          await refetch()
        } catch (e) {
          toast.warn('Thumbnail uploaded, but failed to refresh. Please reload.')
        }
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to upload thumbnail'
      toast.error(errorMessage)
    }
  }

  const triggerFileUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file && firstEntityData && firstProject) {
        await handleUploadThumbnail(file)
      }
    }
    input.click()
  }

  return {
    handleUploadThumbnail,
    triggerFileUpload,
  }
}
