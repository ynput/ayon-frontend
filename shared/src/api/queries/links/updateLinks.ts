import { gqlApi, linksApi, OverviewEntityLinkFragmentFragment } from '@shared/api/generated'
import { patchOverviewTasks } from '../overview'
import { RootState } from '@reduxjs/toolkit/query'
import { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit'
import { PatchOperation } from '@shared/containers'

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

const enhancedApi = linksApi.enhanceEndpoints({
  endpoints: {
    deleteEntityLink: {
      transformErrorResponse: (error: any) => error.data?.detail || '',
      async onQueryStarted(
        // @ts-ignore - patch is purely used for patching the entities
        { linkId, projectName, patch },
        { dispatch, getState, getCacheEntry },
      ) {
        console.log(patch)
      },
    },
    createEntityLink: {
      transformErrorResponse: (error: any) => error.data?.detail || '',
      async onCacheEntryAdded(
        // @ts-ignore - patch is purely used for patching the entities
        { projectName, createLinkRequestModel, patch },
        { dispatch, getState, getCacheEntry, cacheDataLoaded },
      ) {
        const { linkType } = createLinkRequestModel
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
            const res = await Promise.all([cacheDataLoaded, sourcePromise, targetPromise])
            const sourceEntityData = res[1]
            const targetEntityData = res[2]

            if (!sourceEntityData || !targetEntityData) {
              throw new Error('Source or target entity data not found')
            }

            const cacheEntry = getCacheEntry()
            const linkId = cacheEntry?.data?.id

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
            patchOverviewTasks([sourcePatch, targetPatch], { state, dispatch }, patches)
          } else {
            console.warn('Source entity type not provided, falling back to task query')
            throw new Error('Source entity type not provided')
          }
        } catch (error) {
          console.error(error)
        }
      },
    },
  },
})

export const { useDeleteEntityLinkMutation, useCreateEntityLinkMutation } = enhancedApi
