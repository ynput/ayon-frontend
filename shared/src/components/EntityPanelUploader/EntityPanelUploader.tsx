import { ChangeEvent, RefObject, useRef, useState } from 'react'
import clsx from 'clsx'

import { ThumbnailWrapper } from '@shared/containers'
import {
  useCreateVersionMutation,
  useUpdateEntitiesMutation,
  useCreateProductMutation,
} from '@shared/api'
import * as Styled from './EntityPanelUploader.styled'
import Dropzone, { DropzoneType } from './Dropzone'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useReviewablesUpload } from '../ReviewablesList'
import { useDetailsPanelContext } from '@shared/context'
import EntityPanelUploaderDialog from './EntityPanelUploaderDialog'
import { useOptionalVersionUploadContext } from '@shared/components'
import {
  sanitizeProductName,
  createProductHelper,
  createVersionHelper,
  getNextVersionNumber,
  handleUploadError,
} from '@shared/util'

type Operation = {
  id: string
  projectName: string
  currentAssignees: any[]
  data: { updatedAt: string }
}
export type EntityPanelUploaderProps = {
  entityType: string
  entities: any[]
  projectName: any
  /** Hoisted by the parent so ThumbnailUploadProvider (also hoisted) and the
   *  underlying <input> share the same ref identity. */
  thumbnailInputRef: RefObject<HTMLInputElement>
  versionsInputRef: RefObject<HTMLInputElement>
  children?: JSX.Element | JSX.Element[]
  resetFileUploadState?: () => void
  onVersionCreated?: (versionId: string) => void
}

type UploadType = 'thumbnail' | 'version'
const dropZones: (DropzoneType & { id: UploadType })[] = [
  { id: 'thumbnail', label: 'Upload thumbnail', icon: 'add_photo_alternate' },
  { id: 'version', label: 'Upload version', icon: 'layers' },
]

export const EntityPanelUploader = ({
  children = [],
  entityType,
  entities = [],
  projectName,
  thumbnailInputRef,
  versionsInputRef,
  onVersionCreated,
}: EntityPanelUploaderProps) => {
  const { dispatch } = useDetailsPanelContext()
  const versionUploadCtx = useOptionalVersionUploadContext()
  // Dragging and dropping state
  const [isDraggingFile, setIsDraggingFile] = useState(false)
  const [draggingZone, setDraggingZone] = useState<UploadType | null>(null)
  const dragCounterRef = useRef(0)

  // Uploading state
  const [uploadingType, setUploadingType] = useState<UploadType | null>(null)
  const [progress, setProgress] = useState(0)

  // Dialog state for product creation
  const [showProductDialog, setShowProductDialog] = useState(false)
  const [pendingFiles, setPendingFiles] = useState<FileList | null>(null)

  // Check if we have exactly one entity selected
  const singleEntity = entities.length === 1 ? entities[0] : null
  // extra all entity IDs for the single version entity
  const taskId: string | undefined = singleEntity?.task?.id
  const folderId: string | undefined = singleEntity?.folder?.id
  const productId: string | undefined = singleEntity?.product?.id
  const versionId: string | undefined = singleEntity?.id
  const canUploadVersions = Boolean(singleEntity && entityType !== 'representation')

  // Use the custom hook for reviewable upload logic (only when single version)
  const { handleFileUpload: uploadReviewableFiles } = useReviewablesUpload({
    projectName,
    versionId: versionId,
    taskId: taskId,
    folderId: folderId,
    productId: productId,
    dispatch,
    onUpload: () => {
      setUploadingType(null)
      setProgress(0)
    },
    onProgress: (progress) => {
      setProgress(progress)
    },
  })

  // Filter drop zones based on whether we can upload reviewables
  const availableDropZones = dropZones.filter((zone) => {
    if (zone.id === 'version') {
      return canUploadVersions
    }
    return true
  })

  const resetState = () => {
    setUploadingType(null)
    setIsDraggingFile(false)
    setDraggingZone(null)
    dragCounterRef.current = 0
    setProgress(0)
    setShowProductDialog(false)
    setPendingFiles(null)
  }

  // Handle dialog submission - create product and upload version
  const handleDialogSubmit = async (productName: string) => {
    if (!pendingFiles || !singleEntity) {
      setShowProductDialog(false)
      setPendingFiles(null)
      return
    }

    const sanitizedName = sanitizeProductName(productName)

    if (!sanitizedName.trim()) {
      toast.error(
        'Product name must contain valid characters (letters, numbers, underscore, or hyphen)',
      )
      return
    }

    try {
      if (!folderId) {
        throw new Error('Folder ID is required to create a product')
      }
      setUploadingType('version')

      // Create the product
      const productRes = await createProductHelper(createProduct, projectName, {
        folderId: folderId,
        name: sanitizedName,
        productType: 'review', // default product type for uploaded files
        productBaseType: 'review',
      })

      // Close dialog and proceed with version upload
      setShowProductDialog(false)
      await uploadVersionWithProduct(pendingFiles, productRes.id)
      setPendingFiles(null)
    } catch (error: any) {
      handleUploadError(error, 'creating product')
      resetState()
    }
  }

  // Handle dialog cancellation
  const handleDialogCancel = () => {
    setShowProductDialog(false)
    setPendingFiles(null)
    resetState()
  }

  const [createVersion] = useCreateVersionMutation()
  const [createProduct] = useCreateProductMutation()
  // Handle version/reviewable file upload
  const handleVersionUpload = async (files: FileList) => {
    if (!canUploadVersions || !singleEntity) {
      toast.error('Please select exactly one version to upload reviewables')
      return resetState()
    }

    if (versionUploadCtx) {
      const fileArray = Array.from(files)
      const pending = fileArray.map((file) => ({
        file,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      }))
      versionUploadCtx.setPendingFiles((prev) => [...prev, ...pending])

      const product = singleEntity.product
      const linkedTask = singleEntity.task
        ? {
            id: singleEntity.task.id,
            name: singleEntity.task.name,
            label: singleEntity.task.label,
            taskType: singleEntity.task.taskType,
          }
        : undefined

      versionUploadCtx.onOpenVersionUpload({
        productId: product?.id,
        folderId: singleEntity.folder?.id,
        taskId: singleEntity.task?.id,
        linkedTask,
        latestVersionNumber: product?.latestVersion?.version,
        latestVersionId: product?.latestVersion?.id,
      })
      // Reset local upload UI; the dialog now drives the flow.
      resetState()
      return
    }

    const productId = singleEntity.product?.id
    if (!productId) {
      // Show dialog to create product first
      setPendingFiles(files)
      setShowProductDialog(true)
      return
    }

    // If we have a productId, proceed with upload
    await uploadVersionWithProduct(files, productId)
  }

  // Helper function to handle the actual version upload
  const uploadVersionWithProduct = async (files: FileList, productId: string) => {
    try {
      const nextVersion = getNextVersionNumber(singleEntity!.product?.latestVersion)

      // create a new version
      const versionRes = await createVersionHelper(createVersion, projectName, {
        productId,
        taskId, // previous version could have a taskId or we are uploading on a task
        version: nextVersion,
      })

      await uploadReviewableFiles(files, versionRes.id)
      // The hook handles success callbacks, just reset our local state
      resetState()

      // update entity panel to focus the new version
      onVersionCreated?.(versionRes.id)
    } catch (error: any) {
      handleUploadError(error, 'uploading version')
      resetState()
    }
  }

  const handleUploadThumbnail = async (file: File) => {
    if (!file) return resetState()

    try {
      // check file is an image
      if (!file.type.includes('image')) {
        throw new Error('File is not an image')
      }

      let promises = []
      for (const entity of entities) {
        const { id, entityType, projectName } = entity

        if (!projectName) throw new Error('Project name is required')

        const promise = axios.post(
          projectName && `/api/projects/${projectName}/${entityType}s/${id}/thumbnail`,
          file,
          {
            onUploadProgress: (e) => {
              setProgress(Math.round((100 * e.loaded) / (e.total || file.size)))
            },
            headers: {
              'Content-Type': file.type,
            },
          },
        )

        promises.push(promise)
      }

      const res = await Promise.all(promises)

      const updatedEntities = res.map((res, i) => ({
        thumbnailId: res.data.id as string,
        id: entities[i].id,
      }))

      setIsDraggingFile(false)
      resetState()
    } catch (error: any) {
      console.error(error)
      toast.error(error.message)
      resetState()
    }
  }

  const [updateEntities] = useUpdateEntitiesMutation()

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounterRef.current++
    if (dragCounterRef.current === 1) {
      setIsDraggingFile(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounterRef.current--
    if (dragCounterRef.current === 0) {
      setIsDraggingFile(false)
      setDraggingZone(null)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounterRef.current = 0
    setIsDraggingFile(false)
    setDraggingZone(null)

    if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) {
      return
    }

    if (draggingZone === 'thumbnail') {
      setUploadingType('thumbnail')
      const file = e.dataTransfer.files[0]
      // try to upload the thumbnail
      handleUploadThumbnail(file)
    }

    if (draggingZone === 'version') {
      setUploadingType('version')
      const files = e.dataTransfer.files
      // try to upload the reviewables using the hook
      handleVersionUpload(files)
    }
  }

  // upload thumbnail from input (right click on thumbnail)
  const handleInputUpload = async (event: ChangeEvent<HTMLInputElement>, type: UploadType) => {
    const files = event.target.files
    if (!files || files.length === 0) {
      return
    }

    if (type === 'version') {
      setUploadingType('version')
      handleVersionUpload(files)
    }
    if (type === 'thumbnail') {
      setUploadingType('thumbnail')
      handleUploadThumbnail(files[0])
    }
  }

  return (
    <>
      <Styled.DragAndDropWrapper
        className={clsx({ dragging: isDraggingFile })}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <ThumbnailWrapper>
          <div>{children}</div>
        </ThumbnailWrapper>
        {isDraggingFile && (
          <Styled.DropZones>
            {availableDropZones.map((zone) => (
              <Dropzone
                key={zone.id}
                id={zone.id}
                label={zone.label}
                icon={zone.icon}
                isActive={draggingZone === zone.id}
                onDragOver={() => setDraggingZone(zone.id)}
                onDragLeave={() => setDraggingZone(null)}
              />
            ))}
          </Styled.DropZones>
        )}
        {(uploadingType === 'thumbnail' || uploadingType === 'version') && (
          <Styled.DropZones>
            <Styled.UploadingProgress>
              <Styled.Progress
                style={{
                  right: `${100 - progress}%`,
                }}
              />
              <span className="label">{`Uploading ${uploadingType}...`}</span>
            </Styled.UploadingProgress>
            <Styled.CancelButton icon={'close'} variant="text" onClick={resetState} />
          </Styled.DropZones>
        )}
        <input
          type="file"
          onChange={(e) => handleInputUpload(e, 'thumbnail')}
          ref={thumbnailInputRef}
        />
        <input
          type="file"
          onChange={(e) => handleInputUpload(e, 'version')}
          ref={versionsInputRef}
        />
      </Styled.DragAndDropWrapper>

      {/* Product creation dialog */}
      <EntityPanelUploaderDialog
        isOpen={showProductDialog}
        files={pendingFiles}
        onSubmit={handleDialogSubmit}
        onCancel={handleDialogCancel}
      />
    </>
  )
}
