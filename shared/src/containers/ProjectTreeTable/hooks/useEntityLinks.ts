import { useMemo } from 'react'
import { useGetEntityLinksQuery } from '@shared/api'
import type {
  EntityLink,
  EntityWithLinks,
  GetEntityLinksArgs,
} from '@shared/api/queries/links/getEntityLinks'

type UseEntityLinksProps = {
  projectName: string
  entityType: GetEntityLinksArgs['entityType']
  entityIds: Iterable<string>
  skip?: boolean
}

const EMPTY_LINKS: EntityWithLinks[] = []

export const useEntityLinks = ({
  projectName,
  entityType,
  entityIds,
  skip = false,
}: UseEntityLinksProps) => {
  const ids = useMemo(() => Array.from(entityIds), [entityIds])
  const args = useMemo(
    () => ({ projectName, entityIds: ids, entityType }),
    [projectName, ids, entityType],
  )
  const shouldSkip = skip || !ids.length

  const {
    data = EMPTY_LINKS,
    isFetching,
    isUninitialized,
  } = useGetEntityLinksQuery(args, { skip: shouldSkip })

  const links = useMemo(
    () => new Map<string, EntityLink[]>(data.map((entity) => [entity.id, entity.links])),
    [data],
  )

  // requested but not cached yet
  const loadingIds = useMemo(
    () => (!shouldSkip && isFetching ? ids.filter((id) => !links.has(id)) : []),
    [shouldSkip, isFetching, ids, links],
  )

  return { links, loadingIds, args, isUninitialized }
}
