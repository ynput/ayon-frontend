import { ayonApi } from '@queries/ayon'
import { transformEntityData } from '../userDashboard/userDashboardHelpers'
import { buildDetailsQuery } from '../userDashboard/userDashboardQueries'

const getEntityPanel = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    // TODO, move to separate file getEntityPanel
    getEntityDetailsPanel: build.query({
      query: ({ projectName, entityId, entityType }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: buildDetailsQuery(entityType),
          variables: { projectName, entityId },
        },
      }),
      transformResponse: (response, meta, { entityType, projectName, projectInfo }) =>
        transformEntityData({
          projectName: projectName,
          entity: response?.data?.project && response?.data?.project[entityType],
          entityType,
          projectInfo,
        }),
      serializeQueryArgs: ({ queryArgs: { projectName, entityId, entityType } }) => ({
        projectName,
        entityId,
        entityType,
      }),
      providesTags: (res, error, { entityId, entityType }) =>
        res
          ? [
              { type: entityType, id: entityId },
              { type: entityType, id: 'LIST' },
            ]
          : [{ type: entityType, id: 'LIST' }],
    }),
    getEntitiesDetailsPanel: build.query({
      async queryFn({ entities = [], entityType, projectsInfo = {} }, { dispatch }) {
        try {
          const promises = entities.map((entity) =>
            dispatch(
              ayonApi.endpoints.getEntityDetailsPanel.initiate(
                {
                  projectName: entity.projectName,
                  entityId: entity.id,
                  entityType,
                  projectInfo: projectsInfo[entity.projectName],
                },
                { forceRefetch: false },
              ),
            ),
          )

          const res = await Promise.all(promises)

          const entitiesDetails = []
          for (const response of res) {
            if (response.status === 'rejected') {
              console.error('No entity found')
              continue
            }

            entitiesDetails.push(response.data)
          }

          return { data: entitiesDetails }
        } catch (error) {
          console.error(error)
          return error
        }
      },
      serializeQueryArgs: ({ queryArgs: { entities, entityType } }) => ({
        entities,
        entityType,
      }),
      providesTags: (res, error, { entities }) =>
        entities.map(({ id }) => ({ id, type: 'entities' })),
    }),
  }),
})

export const { useGetEntitiesDetailsPanelQuery, useLazyGetEntitiesDetailsPanelQuery } =
  getEntityPanel
