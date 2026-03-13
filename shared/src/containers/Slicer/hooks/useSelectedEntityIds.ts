import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit'
import { entityListsApi, type EntityListEnities } from '@shared/api/generated'
import { useSlicerContext } from '@shared/containers'
import { useProjectContext } from '@shared/context'

export interface SelectedEntityIds {
  folderIds: string[]
  taskIds: string[]
  versionIds: string[]
  productIds: string[]
}

const EMPTY_IDS: SelectedEntityIds = {
  folderIds: [],
  taskIds: [],
  versionIds: [],
  productIds: [],
}

const collectEntityIds = (results: EntityListEnities[]): SelectedEntityIds => {
  const sets = {
    folder: new Set<string>(),
    task: new Set<string>(),
    version: new Set<string>(),
    product: new Set<string>(),
  }

  for (const { entityType, entityIds: listEntityIds } of results) {
    const set = sets[entityType as keyof typeof sets]
    if (set) {
      for (const id of listEntityIds) {
        set.add(id)
      }
    }
  }

  return {
    folderIds: [...sets.folder],
    taskIds: [...sets.task],
    versionIds: [...sets.version],
    productIds: [...sets.product],
  }
}

/**
 * Resolves entity list slicer selections to actual entity IDs.
 * When sliceType is 'entityList', fetches entity IDs from each selected list
 * and groups them by entity type.
 */
export const useSelectedEntityIds = (): {
  entityIds: SelectedEntityIds
  isLoading: boolean
} => {
  const dispatch = useDispatch<ThunkDispatch<unknown, unknown, UnknownAction>>()
  const { rowSelectionData, sliceType } = useSlicerContext()
  const { projectName } = useProjectContext()
  const [entityIds, setEntityIds] = useState<SelectedEntityIds>(EMPTY_IDS)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (sliceType !== 'entityList' || !projectName) {
      setEntityIds(EMPTY_IDS)
      return
    }

    const selectedListIds = Object.keys(rowSelectionData).filter((id) => rowSelectionData[id])

    if (!selectedListIds.length) {
      setEntityIds(EMPTY_IDS)
      return
    }

    let cancelled = false
    setIsLoading(true)

    const fetchEntityIds = async () => {
      try {
        const results = await Promise.all(
          selectedListIds.map((listId) =>
            dispatch(
              entityListsApi.endpoints.getListEntities.initiate({ projectName, listId }),
            ).unwrap(),
          ),
        )

        if (!cancelled) {
          setEntityIds(collectEntityIds(results))
        }
      } catch (err) {
        console.error('Error fetching entity list IDs:', err)
        if (!cancelled) setEntityIds(EMPTY_IDS)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void fetchEntityIds()

    return () => {
      cancelled = true
    }
  }, [sliceType, rowSelectionData, projectName, dispatch])

  return { entityIds, isLoading }
}
