import axios, { AxiosProgressEvent, AxiosResponse } from 'axios'
import { toast } from 'react-toastify'
import { FC, useState, DragEvent, ChangeEvent, useEffect } from 'react'
import clsx from 'clsx'

import { Icon } from '@ynput/ayon-react-components'

import api, { reviewablesQueries } from '@shared/api'
import type { UploadReviewableApiResponse } from '@shared/api'

// components
import { ReviewableProgress, ReviewableProgressCard } from '@shared/components'
import * as Styled from './ReviewablesUpload.styled'

export interface ReviewableUploadProps extends React.HTMLProps<HTMLDivElement> {
  projectName: string | null
  taskId?: string | null
  folderId?: string | null
  versionId?: string | null
  productId?: string | null
  variant?: 'normal' | 'large'
  dispatch: any
  pendingFiles?: Array<{ file: File; preview?: string }>
  setPendingFiles?: React.Dispatch<React.SetStateAction<Array<{ file: File; preview?: string }>>>
  onUpload?: () => void
  onFilesAdded?: (files: File[]) => void
  children?: any
  pt?: {
    upload?: React.HTMLProps<HTMLDivElement>
    dropzone?: React.HTMLProps<HTMLDivElement>
  }
}

export const ReviewableUpload: FC<ReviewableUploadProps> = ({
  projectName,
  taskId,
  folderId,
  versionId,
  productId,
  onUpload,
  onFilesAdded,
  children,
  dispatch,
  variant = 'normal',
  pendingFiles = [],
  setPendingFiles,
  className,
  pt,
  ...props
}) => {
  // are we dragging a file over?
  const [isDraggingFile, setIsDraggingFile] = useState(false)
  const [uploading, setUploads] = useState<{ [key: string]: ReviewableProgress[] }>({})

  // Check if we can upload files straight away
  const canUpload = Boolean(versionId)

  // Monitor changes to versionId to trigger pending uploads
  useEffect(() => {
    if (canUpload && versionId && pendingFiles.length > 0 && setPendingFiles) {
      const files = pendingFiles.map((item) => item.file)
      // Clear pending files for this version and revoke object URLs
      pendingFiles.forEach((item) => {
        if (item.preview) {
          URL.revokeObjectURL(item.preview)
        }
      })
      setPendingFiles([])
      // Start upload
      handleFileUpload(files)
    }
  }, [canUpload, versionId, pendingFiles.length])

  // Helper function to check if file is an image
  const isImageFile = (file: File) => {
    return file.type.startsWith('image/')
  }

  // Helper function to create file items with previews
  const createFileItems = (files: File[]) => {
    return files.map((file) => ({
      file,
      preview: isImageFile(file) ? URL.createObjectURL(file) : undefined,
    }))
  }

  const handleRemoveUpload = (name: string) => {
    if (!versionId) return
    setUploads((uploads) => ({
      ...uploads,
      [versionId]: uploads[versionId]?.filter((upload) => upload.name !== name) || [],
    }))
  }

  const handleFileUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files)

    // Notify parent about files being added for version extraction
    onFilesAdded?.(fileArray)

    // If we can't upload yet, store files as pending
    if (!canUpload || !versionId) {
      if (setPendingFiles) {
        setPendingFiles((prev) => [...prev, ...createFileItems(fileArray)])
      }
      return
    }

    const uploadingFiles = fileArray.map((file) => ({
      name: file.name,
      size: file.size,
      progress: 0,
    }))

    const newUploadsForVersion = [...(uploading[versionId] || []), ...uploadingFiles]

    setUploads({ ...uploading, [versionId]: newUploadsForVersion })

    const successHandler = (file: File) => (response: AxiosResponse) => {
      if (!versionId) return
      // Handle successful upload
      console.log(`Upload successful for ${file.name}`)
      // patch the new data into the reviewables cache
      const data = response.data as UploadReviewableApiResponse

      if (!projectName) return

      dispatch(
        // @ts-ignore
        reviewablesQueries.util.updateQueryData(
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
      folderId && dispatch(api.util.invalidateTags([{ type: 'viewer', id: folderId }]))
      taskId && dispatch(api.util.invalidateTags([{ type: 'viewer', id: taskId }]))
      // remove the file from the list
      handleRemoveUpload(file.name)
    }

    const errorHandler = (file: File) => (error: any) => {
      if (!versionId) return
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
      if (!versionId) return () => {}
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
      for (const file of fileArray) {
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
      <Styled.ReviewablesList
        className={clsx(className, variant, { dragging: isDraggingFile })}
        {...props}
        onDragEnter={() => setIsDraggingFile(true)}
      >
        <>
          {children}
          {/* pending files */}
          {!canUpload &&
            pendingFiles?.map((item) => (
              <ReviewableProgressCard
                key={item.file.name}
                name={item.file.name}
                size={item.file.size}
                src={item.preview}
                type={'waiting'}
                onRemove={() => {
                  if (setPendingFiles) {
                    setPendingFiles((prev) => prev.filter((f) => f.file.name !== item.file.name))
                  }
                }}
              />
            ))}
          {/* uploading items */}
          {versionId &&
            uploading[versionId]?.map((file) => (
              <ReviewableProgressCard
                key={file.name}
                {...file}
                type={'upload'}
                onRemove={() => handleRemoveUpload(file.name)}
              />
            ))}

          {/* upload button */}
          <Styled.Upload
            id="upload"
            className={clsx('upload', variant)}
            style={variantStyles}
            {...pt?.upload}
          >
            <span>Drop or click to upload</span>
            <input type="file" multiple onChange={handleInputChange} />
          </Styled.Upload>
        </>
      </Styled.ReviewablesList>

      {isDraggingFile && (
        <Styled.Dropzone
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={() => setIsDraggingFile(false)}
          onDrop={handleFileDrop}
          {...pt?.dropzone}
        >
          <Icon icon="upload" />
          <span>Upload reviewable</span>
        </Styled.Dropzone>
      )}
    </>
  )
}

export default ReviewableUpload
