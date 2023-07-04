import { ayonApi } from '../ayon'

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
      author: vers ? vers.author : null,
      parents: product.folder.parents,
      versionList: product.versionList || [],
      version: vers ? vers.version : null,
      versionId: vers && vers.id ? vers.id : null,
      versionName: vers && vers.name ? vers.name : '',
      versionStatus: vers.status || null,
      taskId: vers && vers.taskId ? vers.taskId : null,
      taskName: vers && vers.task ? vers.task.name : null,
      frames: parseProductFrames(product),
      createdAt: vers ? vers.createdAt : product.createdAt,
    }
    s.push(sub)
  }
  return s
}

const PRODUCT_VERSION_FRAGMENT = `
fragment ProductVersionFragment on VersionNode {
  id
  productId
  version
  name
  author
  createdAt
  taskId
  task {
    name
  }
  status
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
        products(folderIds: $ids){
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
                        id
                        version
                        name
                        author
                        createdAt
                        taskId
                        task {
                          name
                        }
                        status
                        attrib {
                            fps
                            resolutionWidth
                            resolutionHeight
                            frameStart
                            frameEnd
                        }
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
`

const PRODUCT_VERSION_QUERY = `
query GetProductVersion($projectName: String!, $versionId: String!) {
  project(name: $projectName) {
    version(id: $versionId) {
      ...ProductVersionFragment
    }
  }
}
${PRODUCT_VERSION_FRAGMENT}
`

const getProduct = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    getProductList: build.query({
      query: ({ projectName, ids }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: PRODUCTS_LIST_QUERY,
          variables: { projectName, ids },
        },
      }),
      transformResponse: (response) => parseProductData(response.data),
      providesTags: (result) =>
        result ? [...result.map(({ id }) => ({ type: 'product', id }))] : ['product'],
    }),
    getProductVersion: build.query({
      query: ({ projectName, versionId }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: PRODUCT_VERSION_QUERY,
          variables: { projectName, versionId },
        },
      }),
      transformResponse: (response) => response?.data?.project?.version || {},
    }),
  }),
})

export const { useGetProductListQuery, useLazyGetProductVersionQuery } = getProduct
