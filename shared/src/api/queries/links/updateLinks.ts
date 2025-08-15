import { gqlLinksApi, linksApi } from '@shared/api/generated'
import { RootState } from '@reduxjs/toolkit/query'
import { current, ThunkDispatch, UnknownAction } from '@reduxjs/toolkit'
import { EntityLink, EntityWithLinks, entityLinksApi } from './getEntityLinks'

type Entity = {
  entityType: 'folder' | 'product' | 'version' | 'representation' | 'task' | 'workfile'
  entityId: string
  name: string
  label?: string | null
  parents: string[]
  subType: string | undefined // Optional subtype for folders, products, versions
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
        gqlLinksApi.endpoints.GetTaskLinkData.initiate({
          projectName,
          taskId: entityId,
        }),
      ).unwrap()
      return resTask?.project.task
    }
    case 'folder': {
      const resFolder = await dispatch(
        gqlLinksApi.endpoints.GetFolderLinkData.initiate({
          projectName,
          folderId: entityId,
        }),
      ).unwrap()
      return resFolder?.project.folder
    }
    case 'product': {
      const resProduct = await dispatch(
        gqlLinksApi.endpoints.GetProductLinkData.initiate({
          projectName,
          productId: entityId,
        }),
      ).unwrap()
      return resProduct?.project.product
    }
    case 'version': {
      const resVersion = await dispatch(
        gqlLinksApi.endpoints.GetVersionLinkData.initiate({
          projectName,
          versionId: entityId,
        }),
      ).unwrap()
      return resVersion?.project.version
    }
    case 'representation': {
      const resRepresentation = await dispatch(
        gqlLinksApi.endpoints.GetRepresentationLinkData.initiate({
          projectName,
          representationId: entityId,
        }),
      ).unwrap()
      return resRepresentation?.project.representation
    }
    case 'workfile': {
      const resWorkfile = await dispatch(
        gqlLinksApi.endpoints.GetWorkfileLinkData.initiate({
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

// Helper function to patch entity links cache for all entity types
const patchEntityLinksCache = (
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
  // Helper function to patch a single entity's links
  const patchEntityLinks = (
    entityToPatch: Entity,
    otherEntity: Entity,
    linkDirection: 'in' | 'out',
  ) => {
    // Get the entity links cache entries for this project and entity type
    const tags = [{ type: 'link', id: `${projectName}-${entityToPatch.entityType}` }]
    const entries = entityLinksApi.util.selectInvalidatedBy(state, tags)

    for (const entry of entries) {
      if (entry.endpointName === 'getEntityLinks') {
        console.log(`Patching ${entityToPatch.entityType} links cache`, entry)
        const patch = dispatch(
          entityLinksApi.util.updateQueryData(
            'getEntityLinks',
            entry.originalArgs,
            (draft: EntityWithLinks[]) => {
              console.log(`Patching ${entityToPatch.entityType} links cache`)
              // Find the entity in the cache
              const entityInCache = draft.find((entity) => entity.id === entityToPatch.entityId)
              if (!entityInCache) {
                console.warn(
                  `${entityToPatch.entityType} ${entityToPatch.entityId} not found in cache`,
                )
                return
              }
              if (isDelete) {
                // Remove the link from the entity
                entityInCache.links = entityInCache.links.filter((link) => link.id !== linkId)
              } else {
                console.log(`Adding new link to ${entityToPatch.entityType}`)
                // Add the new link to the entity
                const newLink: EntityLink = {
                  id: linkId,
                  direction: linkDirection,
                  linkType,
                  entityType: otherEntity.entityType,
                  node: {
                    id: otherEntity.entityId,
                    name: otherEntity.name,
                    label: otherEntity.label,
                    parents: otherEntity.parents,
                    subType: otherEntity.subType,
                  },
                }

                // Check if link already exists and update it, or add new one
                const existingLinkIndex = entityInCache.links.findIndex(
                  (link) => link.id === linkId,
                )

                if (existingLinkIndex !== -1) {
                  entityInCache.links[existingLinkIndex] = newLink
                } else {
                  console.log(
                    `Adding new link to ${entityToPatch.entityType} links cache`,
                    newLink,
                    current(entityInCache),
                  )
                  entityInCache.links.push(newLink)
                }
              }
            },
          ),
        )

        patches.push(patch)
      }
    }
  }

  // Patch the source entity with the link
  patchEntityLinks(sourceEntity, targetEntity, direction)

  // Patch the target entity with the link (flip direction)
  const targetDirection = direction === 'in' ? 'out' : 'in'
  patchEntityLinks(targetEntity, sourceEntity, targetDirection)
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
            // Update entity links cache for both entities
            patchEntityLinksCache(
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
              parents: sourceEntityData.parents || [],
              subType: 'subType' in sourceEntityData ? sourceEntityData.subType : undefined,
            }

            const targetEntity: Entity = {
              entityType: targetEntityType,
              entityId: targetEntityId,
              name: targetEntityData.name,
              label: 'label' in targetEntityData ? targetEntityData.label : undefined,
              parents: targetEntityData.parents || [],
              subType: 'subType' in targetEntityData ? targetEntityData.subType : undefined,
            }

            // Update entity links cache for both entities
            patchEntityLinksCache(
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
