import {
  gqlApi,
  linksApi,
  OverviewEntityLinkFragmentFragment,
  foldersApi,
} from '@shared/api/generated'
import { patchOverviewEntities } from '../overview'
import { RootState } from '@reduxjs/toolkit/query'
import { current, ThunkDispatch, UnknownAction } from '@reduxjs/toolkit'
import { PatchOperation } from '@shared/containers'
import { FolderWithLinks, foldersLinksApi } from '../overview/getFoldersLinks'

type Entity = {
  entityType: 'folder' | 'product' | 'version' | 'representation' | 'task' | 'workfile'
  entityId: string
  name: string
  label?: string | null
}

type LinkUpdate = {
  id: string
  direction: 'in' | 'out'
  linkType: string
}

// Helper function to get entity data by type
const getEntityDataByType = async (
  entityType: 'folder' | 'product' | 'version' | 'representation' | 'task' | 'workfile',
  entityId: string,
  projectName: string,
  dispatch: ThunkDispatch<any, any, UnknownAction>,
) => {
  switch (entityType) {
    case 'task': {
      const resTask = await dispatch(
        gqlApi.endpoints.GetTaskLinkData.initiate({
          projectName,
          taskId: entityId,
        }),
      ).unwrap()
      return resTask?.project.task
    }
    case 'folder': {
      const resFolder = await dispatch(
        gqlApi.endpoints.GetFolderLinkData.initiate({
          projectName,
          folderId: entityId,
        }),
      ).unwrap()
      return resFolder?.project.folder
    }
    case 'product': {
      const resProduct = await dispatch(
        gqlApi.endpoints.GetProductLinkData.initiate({
          projectName,
          productId: entityId,
        }),
      ).unwrap()
      return resProduct?.project.product
    }
    case 'version': {
      const resVersion = await dispatch(
        gqlApi.endpoints.GetVersionLinkData.initiate({
          projectName,
          versionId: entityId,
        }),
      ).unwrap()
      return resVersion?.project.version
    }
    case 'representation': {
      const resRepresentation = await dispatch(
        gqlApi.endpoints.GetRepresentationLinkData.initiate({
          projectName,
          representationId: entityId,
        }),
      ).unwrap()
      return resRepresentation?.project.representation
    }
    case 'workfile': {
      const resWorkfile = await dispatch(
        gqlApi.endpoints.GetWorkfileLinkData.initiate({
          projectName,
          workfileId: entityId,
        }),
      ).unwrap()
      return resWorkfile?.project.workfile
    }
    default:
      throw new Error(`Unknown entity type: ${entityType}`)
  }
}

// update entities that are using these links
const getEntityLinkPatch = (source: Entity, target: Entity, link: LinkUpdate) => {
  // build new link object to be patched into entity.links
  const linkPatch: OverviewEntityLinkFragmentFragment = {
    id: link.id,
    direction: link.direction,
    linkType: link.linkType,
    entityType: target.entityType,
    node: {
      id: target.entityId,
      name: target.name,
      label: target.label,
    },
  }
  const entityPatch: PatchOperation = {
    entityType: source.entityType,
    entityId: source.entityId,
    // we are actually updating the entity with the new link
    type: 'update',
    data: { links: [linkPatch] },
  }
  return entityPatch
}

// create a patch operation to delete a link from an entity
const getEntityLinkDeletionPatch = (entity: Entity, linkId: string) => {
  const entityPatch: PatchOperation = {
    entityType: entity.entityType,
    entityId: entity.entityId,
    type: 'update',
    data: { deleteLinks: [linkId] },
  }
  return entityPatch
}

// Helper function to patch getFoldersLinks cache
const patchFoldersLinksCache = (
  {
    projectName,
    sourceEntity,
    targetEntity,
    linkId,
    linkType,
    direction,
    isDelete = false,
  }: {
    projectName: string
    sourceEntity: Entity
    targetEntity: Entity
    linkId: string
    linkType: string
    direction: 'in' | 'out'
    isDelete?: boolean
  },
  {
    state,
    dispatch,
  }: {
    state: RootState<any, any, 'restApi'>
    dispatch: ThunkDispatch<any, any, UnknownAction>
  },
  patches: any[] = [],
) => {
  // Helper function to patch a single folder's links
  const patchFolderLinks = (
    folderEntity: Entity,
    otherEntity: Entity,
    linkDirection: 'in' | 'out',
  ) => {
    // Get the getFoldersLinks cache entries for this project using selectInvalidatedBy
    const tags = [{ type: 'link', id: projectName }]
    const entries = foldersLinksApi.util.selectInvalidatedBy(state, tags)

    for (const entry of entries) {
      if (entry.endpointName === 'getFoldersLinks') {
        console.log(entry)
        const patch = dispatch(
          foldersLinksApi.util.updateQueryData(
            'getFoldersLinks',
            entry.originalArgs,
            (draft: FolderWithLinks[]) => {
              console.log('Patching folder links cache')
              // Find the folder in the cache
              const folderInCache = draft.find((folder) => folder.id === folderEntity.entityId)
              if (!folderInCache)
                return console.warn(`Folder ${folderEntity.entityId} not found in cache`)

              if (isDelete) {
                // Remove the link from the folder
                folderInCache.links.edges = folderInCache.links.edges.filter(
                  (link) => link.id !== linkId,
                )
              } else {
                console.log('Adding new link to folder')
                // Add the new link to the folder
                const newLink: OverviewEntityLinkFragmentFragment = {
                  id: linkId,
                  direction: linkDirection,
                  linkType,
                  entityType: otherEntity.entityType,
                  node: {
                    id: otherEntity.entityId,
                    name: otherEntity.name,
                    label: otherEntity.label,
                  },
                }

                // Check if link already exists and update it, or add new one
                const existingLinkIndex = folderInCache.links.edges.findIndex(
                  (link) => link.id === linkId,
                )

                if (existingLinkIndex !== -1) {
                  folderInCache.links.edges[existingLinkIndex] = newLink
                } else {
                  console.log(
                    'Adding new link to folder links cache',
                    newLink,
                    current(folderInCache),
                  )
                  folderInCache.links.edges.push(newLink)
                }
              }
            },
          ),
        )

        patches.push(patch)
      }
    }
  }

  // Check if source entity is a folder and patch its links
  if (sourceEntity.entityType === 'folder') {
    // For source entity, use the original direction
    patchFolderLinks(sourceEntity, targetEntity, direction)
  }

  // Check if target entity is a folder and patch its links
  if (targetEntity.entityType === 'folder') {
    // For target entity, flip the direction
    const targetDirection = direction === 'in' ? 'out' : 'in'
    patchFolderLinks(targetEntity, sourceEntity, targetDirection)
  }
}

const enhancedApi = linksApi.enhanceEndpoints({
  endpoints: {
    deleteEntityLink: {
      transformErrorResponse: (error: any) => error.data?.detail || '',
      async onQueryStarted(
        // @ts-ignore - patch is purely used for patching the entities
        { linkId, projectName, patch },
        { dispatch, getState, queryFulfilled },
      ) {
        const state = getState()
        let patches: any[] = []

        const sourceEntity = patch?.source
        const targetEntity = patch?.target
        const linkType = patch?.linkType || ''
        const direction = patch?.direction || 'out'

        if (sourceEntity && targetEntity) {
          try {
            // Create patch operations to remove the link from both entities
            const sourcePatch = getEntityLinkDeletionPatch(sourceEntity, linkId)
            const targetPatch = getEntityLinkDeletionPatch(targetEntity, linkId)

            // Update existing tasks/entities with the link removal
            patchOverviewEntities([sourcePatch, targetPatch], { state, dispatch }, patches)

            // Update folders links cache if any entity is a folder
            patchFoldersLinksCache(
              {
                projectName,
                sourceEntity,
                targetEntity,
                linkId,
                linkType,
                direction,
                isDelete: true,
              },
              { state, dispatch },
              patches,
            )

            // Wait for the mutation to finish
            await queryFulfilled
          } catch (error) {
            console.error('Error patching entities during link deletion:', error)
            // Undo patches if there's an error
            for (const patch of patches) {
              patch.undo()
            }
          }
        } else {
          console.warn('Source or target entity not provided for link deletion')
        }
      },
    },
    createEntityLink: {
      transformErrorResponse: (error: any) => error.data?.detail || '',
      async onQueryStarted(
        // @ts-ignore - patch is purely used for patching the entities
        { projectName, createLinkRequestModel, patch },
        { dispatch, getState, queryFulfilled },
      ) {
        const { linkType, id: linkId } = createLinkRequestModel
        const state = getState()

        let patches: any[] = []

        const sourceEntity = patch?.source
        const sourceEntityType = sourceEntity?.entityType
        const sourceEntityId = sourceEntity?.entityId
        const targetEntity = patch?.target
        const targetEntityType = targetEntity?.entityType
        const targetEntityId = targetEntity?.entityId
        const direction = patch?.direction || ('out' as 'in' | 'out')
        const linkTypeName = linkType?.split('|')[0] as string

        try {
          if (sourceEntity.entityType && targetEntity) {
            // Get the source entity data based on its type
            const sourcePromise = getEntityDataByType(
              sourceEntityType,
              sourceEntityId,
              projectName,
              dispatch,
            )

            const targetPromise = getEntityDataByType(
              targetEntityType,
              targetEntityId,
              projectName,
              dispatch,
            )

            // Wait for both cache data and source entity data to be loaded
            const res = await Promise.all([sourcePromise, targetPromise])
            const sourceEntityData = res[0]
            const targetEntityData = res[1]

            if (!sourceEntityData || !targetEntityData) {
              throw new Error('Source or target entity data not found')
            }

            if (!linkId) {
              throw new Error('Link ID not found in cache entry')
            }

            const sourceEntity: Entity = {
              entityType: sourceEntityType,
              entityId: sourceEntityId,
              name: sourceEntityData.name,
              label: 'label' in sourceEntityData ? sourceEntityData.label : undefined,
            }

            const targetEntity: Entity = {
              entityType: targetEntityType,
              entityId: targetEntityId,
              name: targetEntityData.name,
              label: 'label' in targetEntityData ? targetEntityData.label : undefined,
            }

            const link: LinkUpdate = {
              id: linkId,
              direction: direction,
              linkType: linkTypeName,
            }

            // Patch the source entity with the new link
            const sourcePatch = getEntityLinkPatch(sourceEntity, targetEntity, link)

            // Patch the target entity with the new link
            const targetPatch = getEntityLinkPatch(
              targetEntity,
              sourceEntity,
              // flip direction for target entity
              { ...link, direction: direction === 'in' ? 'out' : 'in' },
            )

            // update existing tasks
            patchOverviewEntities([sourcePatch, targetPatch], { state, dispatch }, patches)

            // Update folders links cache if any entity is a folder
            patchFoldersLinksCache(
              {
                projectName,
                sourceEntity,
                targetEntity,
                linkId,
                linkType: linkTypeName,
                direction,
                isDelete: false,
              },
              { state, dispatch },
              patches,
            )

            // Wait for the mutation to finish (undo patches if it fails)

            await queryFulfilled
          } else {
            console.warn('Source entity type not provided, falling back to task query')
            throw new Error('Source entity type not provided')
          }
        } catch (error) {
          console.error(error)

          // Undo patches if the mutation fails
          for (const patch of patches) {
            patch.undo()
          }
        }
      },
    },
  },
})

export const { useDeleteEntityLinkMutation, useCreateEntityLinkMutation } = enhancedApi
