import { gqlLinksApi } from '@shared/api/generated'
import type { GetLinksIntoEntitiesQuery } from '@shared/api/generated/graphqlLinks'
import { normalizeQueryError } from '@shared/api/base/queryError'
import { formatEntityLabel } from './utils/formatEntityLinks'
import type { EntityLink, EntityWithLinks } from './getEntityLinks'

// the server returns at most this many links per request, more are paged
const PAGE_SIZE = 5000
// stop paging after this many links
export const MAX_LINKS_OF_ENTITIES = 50000

export type GetLinksOfEntitiesArgs = {
  projectName: string
  entityIds: string[]
  /** 'in': links whose output is one of the entities, 'out': whose input is */
  direction: 'in' | 'out'
}

export type GetLinksOfEntitiesResult = {
  entities: EntityWithLinks[]
  /** there were more than MAX_LINKS_OF_ENTITIES links */
  truncated: boolean
}

type ProjectLinkEdge = GetLinksIntoEntitiesQuery['project']['links']['edges'][0]

const injectedQueries = gqlLinksApi.injectEndpoints({
  endpoints: (build) => ({
    /**
     * All links into or out of a set of entities, grouped by entity like
     * getEntityLinks. Uses the project-level links query, so it is one request
     * for any number of entities and not limited to 100 links per entity.
     * Cached per set of arguments, no realtime updates.
     */
    getLinksOfEntities: build.query<GetLinksOfEntitiesResult, GetLinksOfEntitiesArgs>({
      queryFn: async ({ projectName, entityIds, direction }, { dispatch }) => {
        if (!entityIds.length) return { data: { entities: [], truncated: false } }
        const endpoint = direction === 'in' ? 'GetLinksIntoEntities' : 'GetLinksFromEntities'
        const byEntity = new Map<string, EntityLink[]>(entityIds.map((id) => [id, []]))
        let after: string | null | undefined
        let count = 0
        let truncated = false
        try {
          do {
            const result = await dispatch(
              gqlLinksApi.endpoints[endpoint].initiate(
                { projectName, entityIds, first: PAGE_SIZE, after },
                { forceRefetch: true, subscribe: false },
              ),
            ).unwrap()
            const { edges, pageInfo } = result.project.links
            for (const edge of edges as ProjectLinkEdge[]) {
              const entityId = direction === 'in' ? edge.outputId : edge.inputId
              const entityType = direction === 'in' ? edge.inputType : edge.outputType
              const node = edge.node
              byEntity.get(entityId)?.push({
                id: edge.id,
                direction,
                linkType: edge.linkType,
                entityType,
                // a node the user may not see is null
                node: node && {
                  ...node,
                  label: formatEntityLabel(node),
                  parents: node.parents || [],
                  subType: 'subType' in node ? node.subType : undefined,
                },
                isRestricted: !node,
              } as EntityLink)
            }
            count += edges.length
            after = pageInfo.hasNextPage ? pageInfo.endCursor : undefined
            truncated = !!after && count >= MAX_LINKS_OF_ENTITIES
          } while (after && !truncated)
        } catch (error: any) {
          return { error: normalizeQueryError(error) }
        }
        return {
          data: {
            entities: [...byEntity].map(([id, links]) => ({ id, links })),
            truncated,
          },
        }
      },
    }),
  }),
})

export const { useGetLinksOfEntitiesQuery } = injectedQueries
