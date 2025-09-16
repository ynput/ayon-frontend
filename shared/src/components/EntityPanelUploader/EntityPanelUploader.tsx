import { ChangeEvent, useRef, useState } from 'react'
import clsx from 'clsx'

import { ThumbnailWrapper } from '@shared/containers'
import {
  useCreateVersionMutation,
  useUpdateEntitiesMutation,
  useCreateProductMutation,
} from '@shared/api'
import * as Styled from './EntityPanelUploader.styled'
import { ThumbnailUploadProvider } from '../../context/ThumbnailUploaderContext'
import Dropzone, { DropzoneType } from './Dropzone'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useReviewablesUpload } from '../ReviewablesList'
import { useDetailsPanelContext } from '@shared/context'
import EntityPanelUploaderDialog from './EntityPanelUploaderDialog'
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
  children?: JSX.Element | JSX.Element[]
  onUploaded?: (operations: Operation[]) => void
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
  onUploaded,
  onVersionCreated,
}: EntityPanelUploaderProps) => {
  const { dispatch } = useDetailsPanelContext()
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

  // once the file has been uploaded, we need to patch the entities with the new thumbnail
  const handleThumbnailFileUploaded = async (thumbnails: any[] = []) => {
    // always set isDragginle to false
    setIsDraggingFile(false)

    // check something was actually uploaded
    if (!entities.length) {
      return
    }

    // patching the updatedAt will force a refresh of the thumbnail url
    const newUpdatedAt = new Date().toISOString()

    let operations: Operation[] = []
    let versionPatches = []

    for (const entity of thumbnails) {
      const entityToPatch = entities.find((e) => e.id === entity.id)
      if (!entityToPatch) continue
      const thumbnailId = entity.thumbnailId
      const currentAssignees = entity.users || []

      operations.push({
        id: entityToPatch.id,
        projectName: entityToPatch.projectName,
        data: { updatedAt: newUpdatedAt },
        currentAssignees,
      })

      const versionPatch = {
        productId: entityToPatch.productId,
        versionUpdatedAt: newUpdatedAt,
        versionThumbnailId: thumbnailId,
      }

      versionPatches.push(versionPatch)
    }

    try {
      await updateEntities({ operations, entityType })
      onUploaded && onUploaded(operations)
    } catch (error) {
      console.error('Error uploading thumbnail:', error)
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

      handleThumbnailFileUploaded(updatedEntities)
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

  const thumbnailInputRef = useRef<HTMLInputElement>(null)
  const versionsInputRef = useRef<HTMLInputElement>(null)

  return (
    <ThumbnailUploadProvider
      entities={entities}
      handleThumbnailUpload={handleThumbnailFileUploaded}
      thumbnailInputRef={thumbnailInputRef}
      versionsInputRef={canUploadVersions ? versionsInputRef : undefined}
    >
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
    </ThumbnailUploadProvider>
  )
}
