import { useRef, useState } from 'react'
import clsx from 'clsx'

import { ThumbnailUploader } from '@shared/components'
import { ThumbnailWrapper } from '@shared/containers'
import { useUpdateEntitiesMutation } from '@shared/api'
import * as Styled from './EntityPanelUploader.styled'
import { ThumbnailUploadProvider } from '../../context/ThumbnailUploaderContext'

type Operation = {
  id: string
  projectName: string
  currentAssignees: any[]
  data: { updatedAt: string }
}
export type EntityPanelUploaderProps = {
  entityType: string
  entities: any[]
  isCompact?: boolean
  projectName: any
  children?: JSX.Element | JSX.Element[]
  onUploaded?: (operations: Operation[]) => void
  resetFileUploadState?: () => void
}

export const EntityPanelUploader = ({
  children = [],
  entityType,
  entities = [],
  isCompact = false,
  onUploaded,
}: EntityPanelUploaderProps) => {
  const [isDraggingFile, setIsDraggingFile] = useState(false)
  const [isUploadingFile, setIsUploadingFile] = useState(false)

  const [updateEntities] = useUpdateEntitiesMutation()

  const handleThumbnailUpload = async (thumbnails: any[] = []) => {
    // always set isDraggingFile to false
    setIsDraggingFile(false)
    setIsUploadingFile(false)

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

  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <ThumbnailUploadProvider
      entities={entities}
      handleThumbnailUpload={handleThumbnailUpload}
      inputRef={inputRef}
    >
      <Styled.DragAndDropWrapper
        className={clsx({ isCompact })}
        onDragEnter={() => setIsDraggingFile(true)}
      >
        <ThumbnailWrapper>
          <div>{children}</div>
        </ThumbnailWrapper>
        <ThumbnailUploader
          entities={entities}
          inputRef={inputRef}
          className={clsx('thumbnail-uploader', { hidden: !isDraggingFile && !isUploadingFile })}
          onUploadInProgress={() => setIsUploadingFile(true)}
          onFinish={handleThumbnailUpload}
          onDragLeave={() => setIsDraggingFile(false)}
          onDragOver={(e) => e.preventDefault()}
        />
        <ThumbnailUploader
          entities={entities}
          inputRef={inputRef}
          className={clsx('thumbnail-uploader', { hidden: !isDraggingFile && !isUploadingFile })}
          onUploadInProgress={() => setIsUploadingFile(true)}
          onFinish={handleThumbnailUpload}
          onDragLeave={() => setIsDraggingFile(false)}
          onDragOver={(e) => e.preventDefault()}
        />
      </Styled.DragAndDropWrapper>
    </ThumbnailUploadProvider>
  )
}
