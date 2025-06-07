import { ChangeEvent, useRef, useState } from 'react'
import clsx from 'clsx'

import { ThumbnailWrapper } from '@shared/containers'
import { useCreateVersionMutation, useUpdateEntitiesMutation } from '@shared/api'
import * as Styled from './EntityPanelUploader.styled'
import { ThumbnailUploadProvider } from '../../context/ThumbnailUploaderContext'
import Dropzone, { DropzoneType } from './Dropzone'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useReviewablesUpload } from '../ReviewablesList'
import { useDetailsPanelContext } from '@shared/context'
// 3811c830436f11f0abc9d6ac5bf0bcfb

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

  // Check if we have exactly one version selected for reviewable uploads
  const singleVersionEntity = entities.length === 1 && entityType === 'version' ? entities[0] : null
  const canUploadReviewables = Boolean(singleVersionEntity)

  // Use the custom hook for reviewable upload logic (only when single version)
  const { handleFileUpload: uploadReviewableFiles, uploading: reviewableUploading } =
    useReviewablesUpload({
      projectName,
      versionId: singleVersionEntity?.id || null,
      taskId: singleVersionEntity?.task?.id || null,
      folderId: singleVersionEntity?.folder?.id || null,
      productId: singleVersionEntity?.product?.id || null,
      dispatch,
      onUpload: () => {
        setUploadingType(null)
        setProgress(0)
      },
      onProgress: (progress) => {
        setProgress(progress)
      },
    })

  // Filter dropzones based on whether we can upload reviewables
  const availableDropZones = dropZones.filter((zone) => {
    if (zone.id === 'version') {
      return canUploadReviewables
    }
    return true
  })

  const resetState = () => {
    setUploadingType(null)
    setIsDraggingFile(false)
    setDraggingZone(null)
    dragCounterRef.current = 0
    setProgress(0)
  }

  const [createVersion] = useCreateVersionMutation()
  // Handle version/reviewable file upload
  const handleVersionUpload = async (files: FileList) => {
    if (!canUploadReviewables || !singleVersionEntity) {
      toast.error('Please select exactly one version to upload reviewables')
      return resetState()
    }

    const productId = singleVersionEntity.product?.id
    if (!productId) {
      toast.error('Product ID is required for version upload')
      return resetState()
    }

    try {
      const nextVersion = singleVersionEntity.product.latestVersion.version
        ? singleVersionEntity.product.latestVersion.version + 1
        : 1

      // create a new version
      const versionRes = await createVersion({
        projectName,
        versionPostModel: {
          productId,
          version: nextVersion,
        },
      }).unwrap()

      if (!versionRes.id) {
        throw new Error('Failed to create new version')
      }

      await uploadReviewableFiles(files, versionRes.id)
      // The hook handles success callbacks, just reset our local state
      resetState()

      // update entity panel to focus the new version
      onVersionCreated?.(versionRes.id)
    } catch (error: any) {
      console.error('Error uploading version:', error)
      console.log(error.message)
      toast.error(error.message)
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
      versionsInputRef={versionsInputRef}
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
    </ThumbnailUploadProvider>
  )
}
