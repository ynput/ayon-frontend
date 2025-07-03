import { useState, useCallback } from 'react'
import axios, { AxiosProgressEvent, AxiosResponse } from 'axios'
import { toast } from 'react-toastify'

import api, { reviewablesQueries } from '@shared/api'
import type { UploadReviewableApiResponse } from '@shared/api'
import type { ReviewableProgress } from '@shared/components'

export interface UseReviewablesUploadProps {
  projectName: string | null
  versionId?: string | null
  taskId?: string | null
  folderId?: string | null
  productId?: string | null
  dispatch: any
  onUpload?: () => void
  onProgress?: (progress: number) => void
}

export interface UploadHandlers {
  handleFileUpload: (files: FileList | File[], versionId?: string) => Promise<void>
  handleRemoveUpload: (name: string) => void
  uploading: { [key: string]: ReviewableProgress[] }
}

export const useReviewablesUpload = ({
  projectName,
  versionId,
  taskId,
  folderId,
  productId,
  dispatch,
  onUpload,
  onProgress,
}: UseReviewablesUploadProps): UploadHandlers => {
  const [uploading, setUploads] = useState<{ [key: string]: ReviewableProgress[] }>({})

  const handleRemoveUpload = useCallback(
    (name: string) => {
      if (!versionId) return
      setUploads((uploads) => ({
        ...uploads,
        [versionId]: uploads[versionId]?.filter((upload) => upload.name !== name) || [],
      }))
    },
    [versionId],
  )

  const handleFileUpload = useCallback(
    async (files: FileList | File[], fileVersionId?: string) => {
      // use the passed versionId or the one from props
      const reviewableVersionId = fileVersionId || versionId
      if (!reviewableVersionId || !projectName) return

      const fileArray = Array.from(files)

      const uploadingFiles = fileArray.map((file) => ({
        name: file.name,
        size: file.size,
        progress: 0,
      }))

      const newUploadsForVersion = [...(uploading[reviewableVersionId] || []), ...uploadingFiles]

      setUploads({ ...uploading, [reviewableVersionId]: newUploadsForVersion })

      const successHandler = (file: File) => (response: AxiosResponse) => {
        if (!reviewableVersionId) return
        // Handle successful upload
        console.log(`Upload successful for ${file.name}`)
        // patch the new data into the reviewables cache
        const data = response.data as UploadReviewableApiResponse

        if (!projectName) return

        dispatch(
          // @ts-ignore
          reviewablesQueries.util.updateQueryData(
            'getReviewablesForVersion',
            { projectName, versionId: reviewableVersionId },
            (draft) => {
              if (!draft.reviewables) {
                draft.reviewables = []
              }
              // @ts-ignore
              draft.reviewables.push(data)
            },
          ),
        )

        // also invalidate the viewer cache
        productId && dispatch(api.util.invalidateTags([{ type: 'viewer', id: productId }]))
        dispatch(api.util.invalidateTags([{ type: 'viewer', id: reviewableVersionId }]))
        folderId && dispatch(api.util.invalidateTags([{ type: 'viewer', id: folderId }]))
        taskId && dispatch(api.util.invalidateTags([{ type: 'viewer', id: taskId }]))
        // remove the file from the list
        handleRemoveUpload(file.name)
      }

      const errorHandler = (file: File) => (error: any) => {
        if (!reviewableVersionId) return
        console.error(`Upload failed for ${file.name}: ${error}`)
        toast.error(`Failed to upload file: ${file.name}`)
        // add error to the file
        setUploads((uploads) => {
          // current uploads for reviewableVersionId
          const currentUploads = uploads[reviewableVersionId] || []
          const updatedUploads = currentUploads.map((upload) => {
            if (upload.name !== file.name) return upload
            return {
              ...upload,
              error: error.response.data.detail || error.message,
            }
          })

          // update state
          return {
            ...uploads,
            [reviewableVersionId]: updatedUploads,
          }
        })
      }

      const progressHandler = (file: File) => {
        if (!reviewableVersionId) return () => {}
        return (progressEvent: AxiosProgressEvent) =>
          setUploads((uploads) => {
            // current uploads for reviewableVersionId
            const currentUploads = uploads[reviewableVersionId] || []
            const updatedUploads = currentUploads.map((upload) => {
              if (upload.name !== file.name) return upload
              return {
                ...upload,
                progress: progressEvent.total
                  ? Math.round((progressEvent.loaded / progressEvent.total) * 100)
                  : 0,
              }
            })

            // Calculate overall progress across all files
            const totalProgress = updatedUploads.reduce(
              (sum, upload) => sum + (upload.progress || 0),
              0,
            )
            const overallProgress = Math.round(totalProgress / updatedUploads.length)

            // Call the onProgress callback with overall progress
            onProgress?.(overallProgress)

            // update state
            return {
              ...uploads,
              [reviewableVersionId]: updatedUploads,
            }
          })
      }

      try {
        // upload the files
        const uploadPromises = fileArray.map((file) => {
          const autoLabel = file.name.split('.').slice(0, -1).join('.')

          const url = `/api/projects/${projectName}/versions/${reviewableVersionId}/reviewables?label=${autoLabel}`
          const headers = { 'content-type': file.type, 'x-file-name': file.name }
          return axios
            .post(url, file, { headers, onUploadProgress: progressHandler(file) })
            .then(successHandler(file))
            .catch(errorHandler(file))
        })

        // Wait for all uploads to complete
        await Promise.all(uploadPromises)

        // Callback after all uploads are finished
        onUpload && onUpload()
      } catch (error) {
        // something went wrong with everything, EEEEK!
        console.error(error)
        toast.error('Failed to upload file/s')
      }
    },
    [
      versionId,
      projectName,
      uploading,
      dispatch,
      productId,
      folderId,
      taskId,
      handleRemoveUpload,
      onUpload,
      onProgress,
    ],
  )

  return {
    handleFileUpload,
    handleRemoveUpload,
    uploading,
  }
}
