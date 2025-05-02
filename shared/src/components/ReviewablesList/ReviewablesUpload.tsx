import axios, { AxiosProgressEvent, AxiosResponse } from 'axios'
import { toast } from 'react-toastify'
import { FC, useState, DragEvent, ChangeEvent } from 'react'
import clsx from 'clsx'

import { Icon } from '@ynput/ayon-react-components'

import api, { getReviewApi } from '@shared/api'
import type { UploadReviewableApiResponse } from '@shared/api'

// components
import { ReviewableProgress, ReviewableProgressCard } from '@shared/components'
import * as Styled from './ReviewablesUpload.styled'
import { useDetailsPanelContext } from '@shared/context'

interface ReviewableUploadProps {
  projectName: string | null
  versionId: string
  productId: string | null
  variant?: 'normal' | 'large'
  onUpload?: () => void
  children?: any
}

const ReviewableUpload: FC<ReviewableUploadProps> = ({
  projectName,
  versionId,
  productId,
  onUpload,
  children,
  variant = 'normal',
}) => {
  const { viewer, dispatch } = useDetailsPanelContext()

  const taskId = viewer.taskId
  const folderId = viewer.folderId

  // are we dragging a file over?
  const [isDraggingFile, setIsDraggingFile] = useState(false)

  const [uploading, setUploads] = useState<{ [key: string]: ReviewableProgress[] }>({})

  const handleRemoveUpload = (name: string) => {
    setUploads((uploads) => ({
      ...uploads,
      [versionId]: uploads[versionId]?.filter((upload) => upload.name !== name) || [],
    }))
  }

  const handleFileUpload = async (files: FileList) => {
    const uploadingFiles = Array.from(files).map((file) => ({
      name: file.name,
      size: file.size,
      progress: 0,
    }))

    const newUploadsForVersion = [...(uploading[versionId] || []), ...uploadingFiles]

    setUploads({ ...uploading, [versionId]: newUploadsForVersion })

    const successHandler = (file: File) => (response: AxiosResponse) => {
      // Handle successful upload
      console.log(`Upload successful for ${file.name}`)
      // patch the new data into the reviewables cache
      const data = response.data as UploadReviewableApiResponse

      if (!projectName) return

      dispatch(
        // @ts-ignore
        getReviewApi.util.updateQueryData(
          'getReviewablesForVersion',
          { projectName, versionId },
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
      dispatch(api.util.invalidateTags([{ type: 'viewer', id: versionId }]))
      dispatch(api.util.invalidateTags([{ type: 'viewer', id: folderId }]))
      dispatch(api.util.invalidateTags([{ type: 'viewer', id: taskId }]))
      // remove the file from the list
      handleRemoveUpload(file.name)
    }

    const errorHandler = (file: File) => (error: any) => {
      console.error(`Upload failed for ${file.name}: ${error}`)
      toast.error(`Failed to upload file: ${file.name}`)
      // add error to the file
      setUploads((uploads) => {
        // current uploads for versionId
        const currentUploads = uploads[versionId] || []
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
          [versionId]: updatedUploads,
        }
      })
    }

    const progressHandler = (file: File) => {
      return (progressEvent: AxiosProgressEvent) =>
        setUploads((uploads) => {
          // current uploads for versionId
          const currentUploads = uploads[versionId] || []
          const updatedUploads = currentUploads.map((upload) => {
            if (upload.name !== file.name) return upload
            return {
              ...upload,
              progress: progressEvent.total
                ? Math.round((progressEvent.loaded / progressEvent.total) * 100)
                : 0,
            }
          })

          // update state
          return {
            ...uploads,
            [versionId]: updatedUploads,
          }
        })
    }

    try {
      // upload the files
      for (const file of files) {
        const autoLabel = file.name.split('.').slice(0, -1).join('.')

        const url = `/api/projects/${projectName}/versions/${versionId}/reviewables?label=${autoLabel}`
        const headers = { 'content-type': file.type, 'x-file-name': file.name }
        axios
          .post(url, file, { headers, onUploadProgress: progressHandler(file) })
          .then(successHandler(file))
          .catch(errorHandler(file))
      }
      // Callback after successful uploads
      onUpload && onUpload()
    } catch (error) {
      // something went wrong with everything, EEEEK!
      console.error(error)
      toast.error('Failed to upload file/s')
    }
  }

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files

    if (files) {
      handleFileUpload(files)
    }
  }

  //   when the user drops a file
  const handleFileDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDraggingFile(false)

    const files = event.dataTransfer.files

    if (files) {
      handleFileUpload(files)
    }
  }
  const variantStyles =
    variant === 'large' ? { minWidth: '360px', maxWidth: '480px', alignSelf: 'center' } : {}

  return (
    <>
      {!isDraggingFile && (
        <Styled.ReviewablesList
          onDragEnter={() => setIsDraggingFile(true)}
          className={clsx(variant)}
        >
          <>
            {children}
            {/* uploading items */}
            {uploading[versionId]?.map((file) => (
              <ReviewableProgressCard
                key={file.name}
                {...file}
                type={'upload'}
                onRemove={() => handleRemoveUpload(file.name)}
              />
            ))}

            {/* upload button */}
            <Styled.Upload id="upload" className={clsx('upload', variant)} style={variantStyles}>
              <span>Drop or click to upload</span>
              <input type="file" multiple onChange={handleInputChange} />
            </Styled.Upload>
          </>
        </Styled.ReviewablesList>
      )}

      {isDraggingFile && (
        <Styled.Dropzone
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={() => setIsDraggingFile(false)}
          onDrop={handleFileDrop}
        >
          <Icon icon="upload" />
          <span>Upload reviewable</span>
        </Styled.Dropzone>
      )}
    </>
  )
}

export default ReviewableUpload
