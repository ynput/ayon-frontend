import api from '@shared/api'
import {
  FOLDER_TILE_FRAGMENT,
  PRODUCT_TILE_FRAGMENT,
  TASK_TILE_FRAGMENT,
  VERSION_TILE_FRAGMENT,
} from '@shared/api/queries/entities/entityQueries'
import { formatEntityTiles } from '@shared/api/queries/entities/getEntity'

const buildEntitiesQuery = (entities = [], arg = '') => {
  return entities
    .map(
      (entity) => `
  ${entity}s(${arg}) {
    edges {
      node {
        ...${entity}TileFragment
      }
    }
  }`,
    )
    .join('')
}

const buildActivityQuery = (entities = [], args: string, name: string) => {
  let query = `query Activity${name}($projectName: String!) {
    project(name: $projectName) {
      ${buildEntitiesQuery(entities, args)}
    }
  }`

  const fragments = {
    folder: FOLDER_TILE_FRAGMENT,
    product: PRODUCT_TILE_FRAGMENT,
    version: VERSION_TILE_FRAGMENT,
    task: TASK_TILE_FRAGMENT,
  }

  // Add fragments
  for (const type of entities) {
    query += fragments[type]
  }

  return query
}

const getProjectDashboard = api.injectEndpoints({
  endpoints: (build) => ({
    getProjectDashboard: build.query({
      query: ({ projectName, panel }) => ({
        url: `/api/projects/${projectName}/dashboard/${panel}`,
      }),
    }),
    getProjectDashboardActivity: build.query({
      query: ({ projectName, entities = [], args = '', name = '' }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: buildActivityQuery(entities, args, name),
          variables: { projectName },
        },
      }),
      transformResponse: (response, _meta, { entities }) =>
        // @ts-expect-error
        formatEntityTiles(response?.data?.project, entities),
      providesTags: ['folder', 'task', 'version', 'product'],
    }),
  }),
  overrideExisting: true,
})

export const { useGetProjectDashboardQuery, useGetProjectDashboardActivityQuery } =
  getProjectDashboard
