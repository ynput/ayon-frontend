// @ts-nocheck

import { api } from '../../../client/graphql'
import {
  PRODUCT_TILE_FRAGMENT,
  FOLDER_TILE_FRAGMENT,
  VERSION_TILE_FRAGMENT,
  TASK_TILE_FRAGMENT,
} from './entityQueries'

const buildEventTileQuery = (type) => {
  return `
  query EventTile($projectName: String!, $id: String!) {
    project(name: $projectName) {
      ${type}(id: $id) {
        id
        name
        status
        updatedAt
      }
    }
  }
  `
}

const buildEntityTilesQuery = (entities) => {
  // const entities =  {[type]: [id, id, id]}

  const typesQuery = Object.entries(entities).reduce(
    (acc, [type, ids]) =>
      acc +
      ` ${type}s(ids: ${JSON.stringify(ids)}) {
      edges {
        node {
          ...${type}TileFragment
        }
      }
    }
    `,
    '',
  )

  let query = `
  query EntityTiles($projectName: String!) {
    project(name: $projectName) {
      ${typesQuery}
    }
  }
  `

  const fragments = {
    folder: FOLDER_TILE_FRAGMENT,
    product: PRODUCT_TILE_FRAGMENT,
    version: VERSION_TILE_FRAGMENT,
    task: TASK_TILE_FRAGMENT,
  }

  // Add fragments
  for (const type in entities) {
    query += fragments[type]
  }

  return query
}

function getNonObjectValue(value) {
  if (typeof value !== 'object' || value === null) {
    return value
  }

  // If value is an object, get the first non-object value from its properties
  let keys = Object.keys(value)
  if (keys.length > 0) {
    return getNonObjectValue(value[keys[0]])
  }

  // If no non-object value found, return undefined
  return undefined
}

export const formatEntityTiles = (project, entities) => {
  // data = {project: {folders: {edges: [{node: {id}}]}}}

  // if entities is an array, convert to object
  if (Array.isArray(entities)) {
    const obj = {}
    for (const entity of entities) {
      obj[entity] = []
    }
    entities = obj
  }

  const allEntities = []
  for (const type in entities) {
    if (!project) continue
    let entities = project[type + 's']
    // If no entities of this type
    if (!entities) continue
    entities = entities.edges.map(({ node }) => ({ ...node, type }))
    allEntities.push(...entities)
  }

  // loop through each entity and child and if it is an array or object, use first child value as value
  for (const entity of allEntities) {
    for (const attrib in entity) {
      if (!entity[attrib]) continue
      if (Array.isArray(entity[attrib])) {
        entity[attrib] = entity[attrib][0]
      } else if (typeof entity[attrib] === 'object') {
        entity[attrib] = getNonObjectValue(Object.values(entity[attrib])[0])
      }
      // if entity type is version, add 0 prefix to version number 1 -> v001, 12 -> v012
      if (entity.type === 'version' && attrib === 'version') {
        entity[attrib] = 'v' + entity[attrib].toString().padStart(3, '0')
      }
    }
    entity.thumbnailEntityType = entity.type
    if (entity.type === 'product') {
      entity.thumbnailEntityId = entity.latestVersion.thumbnailEntityId
      entity.thumbnailId = entity.latestVersion.thumbnailId
      entity.thumbnailEntityType = 'version'
    }
  }

  return allEntities
}

const injectedApi = api.injectEndpoints({
  endpoints: (build) => ({
    getEventTile: build.query({
      query: ({ projectName, id, type }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: buildEventTileQuery(type),
          variables: { projectName, id },
        },
      }),
      transformResponse: (response, meta, { type }) => response.data?.project[type],
    }),
    getEntityTiles: build.query({
      query: ({ projectName, entities }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: buildEntityTilesQuery(entities),
          variables: { projectName },
        },
      }),
      transformResponse: (response, meta, { entities }) =>
        formatEntityTiles(response.data?.project, entities),
    }),
    getEntity: build.query({
      query: ({ projectName, entityType, entityId }) => ({
        url: `/api/projects/${projectName}/${entityType}s/${entityId}`,
      }),
      providesTags: (res, error, { entityId }) => [{ type: 'entity', id: entityId }],
    }),
  }),
  overrideExisting: true,
})

export const getEntityApi = injectedApi.enhanceEndpoints({
  endpoints: {
    GetProductVersions: {},
  },
})

export const {
  useGetEventTileQuery,
  useGetEntityTilesQuery,
  useGetEntityQuery,
  useLazyGetEntityQuery,
  useGetProductVersionsQuery,
} = getEntityApi
