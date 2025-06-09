import { FC, useState, DragEvent, ChangeEvent, useEffect } from 'react'
import clsx from 'clsx'

import { Icon } from '@ynput/ayon-react-components'

// components
import { ReviewableProgressCard } from '@shared/components'
import * as Styled from './ReviewablesUpload.styled'
import { useReviewablesUpload } from './useReviewablesUpload'

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

  // Use the custom hook for upload logic
  const {
    handleFileUpload: uploadFiles,
    handleRemoveUpload,
    uploading,
  } = useReviewablesUpload({
    projectName,
    versionId,
    taskId,
    folderId,
    productId,
    dispatch,
    onUpload,
  })

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
      uploadFiles(files)
    }
  }, [canUpload, versionId, pendingFiles.length, uploadFiles, setPendingFiles])

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

    // Use the hook's upload function for actual uploading
    await uploadFiles(files)
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
