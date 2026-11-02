import { useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit'
import { entityListsApi, type EntityListEnities } from '@shared/api/generated'
import {
  resolveEntityParents,
  type EntityParentMaps,
  type SelectedEntityIds,
} from '@shared/api/queries/entityLists/resolveEntityParents'
import type { SliceSelection } from '../util/createFilterFromSlicer'

export type { EntityParentMaps, SelectedEntityIds }

const EMPTY_IDS: SelectedEntityIds = {
  folderIds: [],
  taskIds: [],
  versionIds: [],
  productIds: [],
}

const EMPTY_MAPS: EntityParentMaps = {
  taskFolderIds: {},
  versionFolderIds: {},
  productFolderIds: {},
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
 * When a panel with sliceType 'entityList' exists, fetches entity IDs from each
 * selected list, then resolves cross-entity parent references
 * (e.g. task → folder, version → folder/task).
 */
export const useSelectedEntityIds = ({
  slices,
  projectName,
}: {
  slices: SliceSelection[]
  projectName: string
}): {
  entityIds: SelectedEntityIds
  rawEntityIds: SelectedEntityIds
  parentMaps: EntityParentMaps
  isLoading: boolean
} => {
  const dispatch = useDispatch<ThunkDispatch<unknown, unknown, UnknownAction>>()
  const [entityIds, setEntityIds] = useState<SelectedEntityIds>(EMPTY_IDS)
  const [rawEntityIds, setRawEntityIds] = useState<SelectedEntityIds>(EMPTY_IDS)
  const [parentMaps, setParentMaps] = useState<EntityParentMaps>(EMPTY_MAPS)
  // what the ids in state were resolved from; anything else means they are stale
  const [resolvedKey, setResolvedKey] = useState('')

  const listRowSelection = slices.find((slice) => slice.sliceType === 'entityList')?.rowSelection

  // Get selected list IDs from rowSelection, filtering out folder-grouped rows
  const selectedListIds = useMemo(
    () =>
      Object.keys(listRowSelection ?? {})
        .filter((id) => listRowSelection?.[id] && !id.startsWith('folder-'))
        .sort(),
    [listRowSelection],
  )

  // consumers skip their queries while this is loading, so it has to flip in the same
  // render as the selection rather than a render later from inside the effect
  const requestKey =
    selectedListIds.length && projectName ? `${projectName}|${selectedListIds}` : ''

  useEffect(() => {
    if (!requestKey) {
      setEntityIds(EMPTY_IDS)
      setRawEntityIds(EMPTY_IDS)
      setParentMaps(EMPTY_MAPS)
      setResolvedKey('')
      return
    }

    let cancelled = false

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

        if (!cancelled) {
          setRawEntityIds(rawIds)
        }

        // Step 2: Resolve cross-entity parent references
        const { parentMaps: resolvedMaps, ...resolvedIds } = await resolveEntityParents(
          rawIds,
          projectName,
          dispatch,
        )

        if (!cancelled) {
          setEntityIds(resolvedIds)
          setParentMaps(resolvedMaps)
        }
      } catch (err) {
        console.error('Error fetching entity list IDs:', err)
        if (!cancelled) {
          setEntityIds(EMPTY_IDS)
          setRawEntityIds(EMPTY_IDS)
          setParentMaps(EMPTY_MAPS)
        }
      } finally {
        if (!cancelled) setResolvedKey(requestKey)
      }
    }

    void fetchEntityIds()

    return () => {
      cancelled = true
    }
  }, [requestKey, selectedListIds, projectName, dispatch])

  return { entityIds, rawEntityIds, parentMaps, isLoading: requestKey !== resolvedKey }
}
