import { useState } from 'react'
import clsx from 'clsx'
import ThumbnailUploader from '@components/ThumbnailUploader/ThumbnailUploader'
import { ThumbnailWrapper } from '@containers/DetailsPanel/DetailsPanelHeader/DetailsPanelHeader.styled'

import { useUpdateEntitiesMutation } from '@queries/entity/updateEntity'
import usePatchProductsListWithVersions from '@hooks/usePatchProductsListWithVersions'
import { $Any } from '@/types'

type Operation = {
  id: string
  projectName: string,
  currentAssignees: $Any[],
  data: { updatedAt: string }
}
type Props = {
  entityType: string
  entities: any[]
  isCompact:boolean
  projectName: any
  isLoading: any,
  children: any[],
  onUploaded: (operations: Operation[]) => void
}

const EntityThumbnailUploader = ({
  children = [],
  entityType,
  entities = [],
  isCompact = false,
  isLoading,
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

  return (
    <div
      className={clsx('details-panel-header', { isCompact })}
      onDragEnter={() => setIsDraggingFile(true)}
    >
      <header className={clsx('titles', { isCompact, loading: isLoading }, 'no-shimmer')}>
        <ThumbnailWrapper>
          {children}
        </ThumbnailWrapper>
      </header>
      {isDraggingFile && (
        <ThumbnailUploader
          onFinish={handleThumbnailUpload}
          onDragLeave={() => setIsDraggingFile(false)}
          onDragOver={(e) => e.preventDefault()}
          className="thumbnail-uploader"
          entities={entities}
        />
      )}
    </div>
  )
}

export default EntityThumbnailUploader
