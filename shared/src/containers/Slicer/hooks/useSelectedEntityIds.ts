import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit'
import { entityListsApi, type EntityListEnities } from '@shared/api/generated'
import { useSlicerContext } from '@shared/containers'
import { useProjectContext } from '@shared/context'
import {
  resolveEntityParents,
  type SelectedEntityIds,
} from '@shared/api/queries/entityLists/resolveEntityParents'

export type { SelectedEntityIds }

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
 * When sliceType is 'entityList', fetches entity IDs from each selected list,
 * then resolves cross-entity parent references (e.g. task → folder, version → folder/task).
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

    // Resolve folder selections to child list IDs
    const selectedKeys = Object.keys(rowSelectionData).filter((id) => rowSelectionData[id])
    const listIdSet = new Set<string>()

    for (const key of selectedKeys) {
      if (key.startsWith('folder-')) {
        // Folder row: extract child list IDs from the row data
        const rowData = rowSelectionData[key]
        if (rowData && typeof rowData === 'object' && 'data' in rowData) {
          const data = (rowData as { data?: { childListIds?: string[] } }).data
          if (data?.childListIds) {
            for (const id of data.childListIds) {
              listIdSet.add(id)
            }
          }
        }
      } else {
        listIdSet.add(key)
      }
    }

    const selectedListIds = [...listIdSet]

    if (!selectedListIds.length) {
      setEntityIds(EMPTY_IDS)
      return
    }

    let cancelled = false
    setIsLoading(true)

    const fetchEntityIds = async () => {
      try {
        // Step 1: Get raw entity IDs from each selected list
        const results = await Promise.all(
          selectedListIds.map((listId) =>
            dispatch(
              entityListsApi.endpoints.getListEntities.initiate({ projectName, listId }),
            ).unwrap(),
          ),
        )

        const rawIds = collectEntityIds(results)

        // Step 2: Resolve cross-entity parent references
        const resolvedIds = await resolveEntityParents(rawIds, projectName, dispatch)

        if (!cancelled) {
          setEntityIds(resolvedIds)
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