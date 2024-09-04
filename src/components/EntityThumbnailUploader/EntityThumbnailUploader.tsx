import axios from 'axios'
import { ChangeEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'

import ThumbnailUploader from '@components/ThumbnailUploader/ThumbnailUploader'
import { ThumbnailWrapper } from '@containers/DetailsPanel/DetailsPanelHeader/DetailsPanelHeader.styled'
import { useUpdateEntitiesMutation } from '@queries/entity/updateEntity'
import usePatchProductsListWithVersions from '@hooks/usePatchProductsListWithVersions'
import { $Any } from '@/types'
import * as Styled from './EntityThumbnailUploader.styled'
import { ThumbnailUploadProvider } from './ThumbnailUploaderProvider'

type Operation = {
  id: string
  projectName: string,
  currentAssignees: $Any[],
  data: { updatedAt: string }
}
type Props = {
  entityType: string
  entities: $Any[]
  isCompact: boolean
  projectName: any
  children?: JSX.Element|JSX.Element[];
  fileUpload: false,
  onUploaded: (operations: Operation[]) => void
  resetFileUploadState: () => void
}

const EntityThumbnailUploader = ({
  children = [],
  entityType,
  entities = [],
  isCompact = false,
  fileUpload,
  onUploaded,
}: Props) => {
  const [isDraggingFile, setIsDraggingFile] = useState(false)

  const [updateEntities] = useUpdateEntitiesMutation()
  const patchProductsListWithVersions = usePatchProductsListWithVersions({
    projectName: entities[0]?.projectName,
  })

  const handleThumbnailUpload = async (thumbnails: any[] = []) => {
    // always set isDraggingFile to false
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

    let productsPatch = patchProductsListWithVersions(versionPatches)
    try {
      await updateEntities({ operations, entityType })
      onUploaded && onUploaded(operations)
    } catch (error) {
      productsPatch?.undo()
    }
  }

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
      // resetFileUploadState()
      if (fileUpload) {
        inputRef.current?.click()
      }
  }, [fileUpload])

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) {
      return
    }

    const file = files[0]
    if (!file) {
      return
    }

    try {
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

      handleThumbnailUpload(updatedEntities)
    } catch (error: any) {
      console.error(error)
    }
  }

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
        <ThumbnailWrapper>{children}</ThumbnailWrapper>
        {isDraggingFile && (
          <ThumbnailUploader
            onFinish={handleThumbnailUpload}
            onDragLeave={() => setIsDraggingFile(false)}
            onDragOver={(e) => e.preventDefault()}
            className="thumbnail-uploader"
            entities={entities}
          />
        )}
        <input type="file" onChange={handleFileUpload} ref={inputRef} />
      </Styled.DragAndDropWrapper>
    </ThumbnailUploadProvider>
  )
}

export default EntityThumbnailUploader
