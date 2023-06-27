import { ayonApi } from '../ayon'
import {
  FOLDER_QUERY,
  PRODUCT_QUERY,
  TASK_QUERY,
  VERSION_QUERY,
  PRODUCT_TILE_FRAGMENT,
  FOLDER_TILE_FRAGMENT,
  VERSION_TILE_FRAGMENT,
  TASK_TILE_FRAGMENT,
} from './entityQueries'
import ayonClient from '/src/ayon'

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

const buildEntitiesQuery = (type, attribs) => {
  let f_attribs = attribs || ''
  if (!attribs) {
    for (const attrib of ayonClient.settings.attributes) {
      if (attrib.scope.includes(type)) f_attribs += `${attrib.name}\n`
    }
  }

  let QUERY
  switch (type) {
    case 'task':
      QUERY = TASK_QUERY
      break
    case 'folder':
      QUERY = FOLDER_QUERY
      break
    case 'version':
      QUERY = VERSION_QUERY
      break
    case 'product':
      QUERY = PRODUCT_QUERY
      break
    default:
      break
  }

  if (!QUERY) return null

  return QUERY.replace('#ATTRS#', f_attribs)
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

  // which entity type to use for thumbnail
  const thumbnailTypes = {
    version: 'version',
    product: 'version',
    folder: 'folder',
    task: 'folder',
  }

  // loop through each entity and child and if it is an array or object, use first child value as value
  for (const entity of allEntities) {
    for (const attrib in entity) {
      if (!entity[attrib]) continue
      if (Array.isArray(entity[attrib])) {
        entity[attrib] = entity[attrib][0]
      } else if (typeof entity[attrib] === 'object') {
        entity[attrib] = Object.values(entity[attrib])[0]
      }
      // if entity type is version, add 0 prefix to version number 1 -> v001, 12 -> v012
      if (entity.type === 'version' && attrib === 'subTitle') {
        entity[attrib] = 'v' + entity[attrib].toString().padStart(3, '0')
      }
    }
    entity.thumbnailEntityType = thumbnailTypes[entity.type]
  }

  return allEntities
}

const getEntity = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    getEntitiesDetails: build.query({
      query: ({
        projectName,
        ids,
        type,
        versionOverrides = ['00000000000000000000000000000000'],
        attribs,
      }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: buildEntitiesQuery(type, attribs),
          variables: { projectName, ids, versionOverrides },
        },
      }),
      transformResponse: (response, meta, { type }) => response.data.project[type + 's'].edges,
      transformErrorResponse: (error) => error.data?.detail || `Error ${error.status}`,
      providesTags: (result, error, { type }) =>
        result
          ? [
              ...result.map(({ node }) => {
                // console.log({ type: type, id: node.id })
                return { type: type, id: node.id }
              }),
            ]
          : [type],
    }),
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
})

export const {
  useGetEntitiesDetailsQuery,
  useGetEventTileQuery,
  useGetEntityTilesQuery,
  useGetEntityQuery,
  useLazyGetEntityQuery,
} = getEntity
