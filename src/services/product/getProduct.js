import api from '@shared/api'

const parseProductFps = (product) => {
  const folderFps = product.folder.attrib.fps || ''
  if (!product) return folderFps
  if (!product.latestVersion) return folderFps
  if (!product.latestVersion.attrib) return folderFps
  return product.latestVersion.attrib.fps || ''
}

const parseProductResolution = (product) => {
  /* 
    Return the resolution of the latest version of the given product, 
    or resolution of the folder if the version has no resolution 
    */
  const folderWidth = product.folder.attrib.resolutionWidth || null
  const folderHeight = product.folder.attrib.resolutionHeight || null
  const folderResolution = folderWidth && folderHeight ? `${folderWidth}x${folderHeight}` : ''

  if (!product?.latestVersion?.attrib) return folderResolution

  const width = product.latestVersion.attrib.resolutionWidth || null
  const height = product.latestVersion.attrib.resolutionHeight || null
  const resolution = width && height ? `${width}x${height}` : ''
  return resolution || folderResolution
}

const parseProductFrames = (product) => {
  const folderStart = product.folder.attrib.frameStart || null
  const folderEnd = product.folder.attrib.frameEnd || null
  const folderFrames = folderStart && folderEnd ? `${folderStart}-${folderEnd}` : ''

  if (!product?.latestVersion?.attrib) return ''
  const frameStart = product.latestVersion.attrib.frameStart || ''
  const frameEnd = product.latestVersion.attrib.frameEnd || ''
  const frames = frameStart && frameEnd ? `${frameStart}-${frameEnd}` : ''
  return frames || folderFrames
}

const parseProductData = (data) => {
  if (!data?.project) return []
  let s = []
  for (let productEdge of data.project.products.edges) {
    let product = productEdge.node

    const vers = product.latestVersion

    let sub = {
      id: product.id,
      name: product.name,
      productType: product.productType,
      status: product.status,
      fps: parseProductFps(product),
      resolution: parseProductResolution(product),
      folder: product.folder.label || product.folder.name,
      folderId: product.folder.id,
      parents: product.folder.parents,
      versionList: product.versionList || [],
      version: vers ? vers.version : null,
      versionId: vers && vers.id ? vers.id : null,
      versionName: vers && vers.name ? vers.name : '',
      versionStatus: vers ? vers.status : null,
      versionUpdatedAt: vers ? vers.updatedAt : null,
      versionAuthor: vers ? vers.author : null,
      versionThumbnailId: vers ? vers.thumbnailId : null,
      hasReviewables: vers ? vers.hasReviewables : false,
      taskId: vers && vers.taskId ? vers.taskId : null,
      taskName: vers && vers.task ? vers.task.name : null,
      taskType: vers && vers.task ? vers.task.taskType : null,
      frames: parseProductFrames(product),
      createdAt: vers ? vers.createdAt : product.createdAt,
    }
    s.push(sub)
  }

  // sort alphabetically by name
  s.sort((a, b) => a.name.localeCompare(b.name))

  return s
}

const parseVersionsData = (data) =>
  data?.project?.versions?.edges?.map((edge) => {
    const node = edge.node || {}
    return {
      version: node.version,
      versionId: node.id,
      versionName: node.name,
      versionStatus: node.status,
      versionUpdatedAt: node.updatedAt,
      versionAuthor: node.author,
      productId: node.productId,
      hasReviewables: node.hasReviewables,
    }
  })

const PRODUCT_VERSION_FRAGMENT = `
fragment ProductVersionFragment on VersionNode {
  id
  productId
  version
  name
  author
  createdAt
  updatedAt
  thumbnailId
  taskId
  status
  hasReviewables
  task {
    name
    taskType
  }
  attrib {
      fps
      resolutionWidth
      resolutionHeight
      frameStart
      frameEnd
  }
}
`

const PRODUCTS_LIST_QUERY = `
query ProductsList($projectName: String!, $ids: [String!]!) {
    project(name: $projectName){
        products(folderIds: $ids, first: 1000){
            edges {
                node {
                    id
                    name
                    productType
                    status
                    createdAt
                    versionList{
                      id
                      version
                      name
                    }
                    latestVersion{
                      ...ProductVersionFragment
                    }
                    folder {
                        id
                        name
                        parents
                        attrib {
                            fps
                            resolutionWidth
                            resolutionHeight
                            frameStart
                            frameEnd
                        }
                    }
                }
            }
        }
    }
}
${PRODUCT_VERSION_FRAGMENT}
`

// get product versions by id
const PRODUCT_VERSIONS_QUERY = `
query GetProductsVersions($projectName: String!, $ids: [String!]!) {
  project(name: $projectName) {
    versions(ids: $ids) {
      edges {
        node {
          ...ProductVersionFragment
        }
      }
    }
  }
}
${PRODUCT_VERSION_FRAGMENT}
`

export const getProductApi = api.injectEndpoints({
  endpoints: (build) => ({
    getProductList: build.query({
      query: ({ projectName, folderIds }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: PRODUCTS_LIST_QUERY,
          variables: { projectName, ids: folderIds },
        },
        validateStatus: (response, result) => response.status === 200 && !result?.errors?.length,
      }),
      transformErrorResponse: (error) => error?.data?.errors?.[0]?.message,
      transformResponse: (response) => parseProductData(response.data),
      providesTags: (result, _e, { folderIds = [] }) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'product', id })),
              { type: 'product', id: 'LIST' },
              ...folderIds.map((id) => ({ type: 'product', id })),
            ]
          : [{ type: 'product', id: 'LIST' }],
    }),
    getProductsVersions: build.query({
      query: ({ projectName, ids }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: PRODUCT_VERSIONS_QUERY,
          variables: { projectName, ids },
        },
      }),
      transformResponse: (response) => parseVersionsData(response.data) || [],
      providesTags: (result, _e, { ids }) =>
        result
          ? [
              ...result.map(({ versionId }) => ({ type: 'version', id: versionId })), // all version tags with id
              ...ids.map((id) => ({ type: 'product', id })), // all version tags with id
              { type: 'version', id: 'LIST' }, // tag for all versions
            ]
          : [{ type: 'version', id: 'LIST' }],
    }),
  }),
  overrideExisting: true,
})

export const {
  useGetProductListQuery,
  useLazyGetProductsVersionsQuery,
  useGetProductsVersionsQuery,
} = getProductApi
