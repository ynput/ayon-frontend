import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { debounce } from 'lodash'
import {
  LISTS_MEMBERSHIP_ENTITY_TYPES,
  ListMembership,
  ListsMembershipEntityType,
  listsMembershipApi,
  useGetListsMembershipQuery,
} from '@shared/api/queries/entityLists/getListsMembership'

const VISIBLE_ENTITIES_DEBOUNCE_MS = 200

export const isListsMembershipEntityType = (
  entityType?: string,
): entityType is ListsMembershipEntityType =>
  LISTS_MEMBERSHIP_ENTITY_TYPES.includes(entityType as ListsMembershipEntityType)

type VisibleEntity = { id: string; entityType: string }

export const useFetchListsMembership = ({
  projectName,
  entities,
  enabled,
}: {
  projectName: string
  entities: VisibleEntity[]
  enabled: boolean
}) => {
  const entitiesKey = enabled
    ? entities
        .filter((entity) => entity.id && isListsMembershipEntityType(entity.entityType))
        .map((entity) => `${entity.entityType}:${entity.id}`)
        .sort()
        .join(',')
    : ''

  const [debouncedKey, setDebouncedKey] = useState(entitiesKey)
  const setKey = useMemo(() => debounce(setDebouncedKey, VISIBLE_ENTITIES_DEBOUNCE_MS), [])

  useEffect(() => {
    setKey(entitiesKey)
    return () => setKey.cancel()
  }, [entitiesKey, setKey])

  const idsByType = useMemo(() => {
    const ids: Record<ListsMembershipEntityType, string[]> = { folder: [], task: [], version: [] }
    for (const item of debouncedKey ? debouncedKey.split(',') : []) {
      const [entityType, id] = item.split(':') as [ListsMembershipEntityType, string]
      ids[entityType].push(id)
    }
    return ids
  }, [debouncedKey])

  const skip = (entityType: ListsMembershipEntityType) =>
    !enabled || !projectName || !idsByType[entityType].length

  useGetListsMembershipQuery(
    { projectName, entityType: 'folder', entityIds: idsByType.folder },
    { skip: skip('folder') },
  )
  useGetListsMembershipQuery(
    { projectName, entityType: 'task', entityIds: idsByType.task },
    { skip: skip('task') },
  )
  useGetListsMembershipQuery(
    { projectName, entityType: 'version', entityIds: idsByType.version },
    { skip: skip('version') },
  )
}

// undefined while the entity's lists have not been fetched yet
export const useEntityListsMembership = (
  projectName: string,
  entityType: ListsMembershipEntityType,
  entityId: string,
): ListMembership[] | undefined => {
  const selectMembership = useMemo(
    () =>
      listsMembershipApi.endpoints.getListsMembership.select({
        projectName,
        entityType,
        entityIds: [],
      }),
    [projectName, entityType],
  )

  return useSelector((state: any) => {
    const entry = selectMembership(state)
    return entry.data?.[entityId] ?? (entry.isError ? NO_LISTS : undefined)
  })
}

const NO_LISTS: ListMembership[] = []
