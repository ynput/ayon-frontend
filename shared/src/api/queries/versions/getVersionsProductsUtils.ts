import { GetProductsQuery, GetVersionsQuery } from '@shared/api/generated'
import {
  GetProductsResult,
  GetVersionsResult,
  ProductInfiniteResult,
  ProductNode,
  ProductNodeRAW,
  VersionInfiniteResult,
  VersionNode,
  VersionNodeRAW,
} from './getVersionsProducts'
import { parseAllAttribs } from '../overview'

// TAGS
const VERSION_TYPE = 'version' as const
const versionsListTag = { type: VERSION_TYPE, id: 'LIST' }
const PRODUCT_TYPE = 'product' as const
const productsListTag = { type: PRODUCT_TYPE, id: 'LIST' }

const ENTITY_TAGS = {
  version: { type: VERSION_TYPE, list: versionsListTag },
  product: { type: PRODUCT_TYPE, list: productsListTag },
} as const

export const provideTagsForEntity = (
  result: VersionNode[] | ProductNode[] | undefined,
  entityType: 'version' | 'product',
) => {
  return result
    ? [
        ...result.map(
          (version) => ({ type: ENTITY_TAGS[entityType].type, id: version.id } as const),
        ),
        ENTITY_TAGS[entityType].list,
      ]
    : [ENTITY_TAGS[entityType].list]
}

const getVersionsTagsFromResult = (versions: VersionNode[]) => {
  const versionTags = provideTagsForEntity(versions, 'version')
  const productTags = provideTagsForEntity(
    versions.map((v) => v.product).filter((p): p is ProductNode => !!p),
    'product',
  )
  return [...versionTags, ...productTags]
}

export const provideTagsForVersionsResult = (result: GetVersionsResult | undefined) => {
  if (!result) return provideTagsForEntity(undefined, 'version')
  return getVersionsTagsFromResult(result.versions)
}

export const provideTagsForVersionsInfinite = (result: VersionInfiniteResult) => {
  if (!result) return provideTagsForEntity(undefined, 'version')
  return getVersionsTagsFromResult(flattenInfiniteVersionsData(result))
}

export const provideTagsForProductsInfinite = (result: ProductInfiniteResult) => {
  if (!result) return [productsListTag, ...provideTagsForEntity(undefined, 'product')]
  const products = flattenInfiniteProductsData(result)
  const productTags = provideTagsForEntity(products, 'product')
  const versionTags = provideTagsForEntity(
    products.map((p) => p.featuredVersion).filter((v): v is VersionNode => !!v),
    'version',
  )
  return [...productTags, ...versionTags]
}

// create all the tags for the products and the version tags for the latest version
export const provideTagsForProductsResult = (result: GetProductsResult | undefined) => {
  if (!result) return [productsListTag, ...provideTagsForEntity(undefined, 'product')]
  const productTags = provideTagsForEntity(result.products, 'product')
  const versionTags = provideTagsForEntity(
    result.products.map((p) => p.featuredVersion).filter((v): v is VersionNode => !!v),
    'version',
  )
  return [...productTags, ...versionTags]
}

// TRANSFORMERS
export const extractVersions = (edges: Array<{ node: VersionNodeRAW }>): VersionNodeRAW[] => {
  const versionNodes: VersionNodeRAW[] = []

  for (const { node } of edges) {
    if (Math.sign(node.version) === -1) {
      // skip hero versions
      continue
    } else {
      versionNodes.push(node)
    }
  }

  return versionNodes
}

export const flattenInfiniteVersionsData = (data: VersionInfiniteResult): VersionNode[] => {
  if (!data) return []
  return data.pages.flatMap((page) => page.versions)
}

export const flattenInfiniteProductsData = (data: ProductInfiniteResult): ProductNode[] => {
  if (!data) return []
  return data.pages.flatMap((page) => page.products)
}

export const transformVersionNode = (node: VersionNodeRAW): VersionNode => {
  const attrib = parseAllAttribs(node.allAttrib)

  // Parse product attributes if product exists
  const product = node.product
    ? {
        ...node.product,
        attrib: parseAllAttribs(node.product.allAttrib),
        folder: {
          ...node.product.folder,
          attrib: parseAllAttribs(node.product.folder.allAttrib),
        },
      }
    : node.product

  const version = {
    ...node,
    attrib,
    product,
  } as VersionNode

  return version
}

export const transformVersionsResponse = (response: GetVersionsQuery): GetVersionsResult => {
  const pageInfo = response.project.versions.pageInfo
  const versionNodes = extractVersions(response.project.versions.edges)
  const versions = versionNodes.map((node) => transformVersionNode(node))
  return { pageInfo, versions }
}

const transformProductVersionToExtendedVersion = (product: ProductNodeRAW): VersionNode | null => {
  if (!product.featuredVersion) return null
  return transformVersionNode({
    ...product.featuredVersion,
    product: {
      id: product.id,
      name: product.name,
      productType: product.productType,
      allAttrib: product.allAttrib,
      folder: {
        allAttrib: product.folder.allAttrib,
      },
    },
  } as VersionNodeRAW)
}

export const transformProductsResponse = (response: GetProductsQuery): GetProductsResult => {
  const pageInfo = response.project.products.pageInfo
  const products = response.project.products.edges.map((edge) => {
    const product = edge.node
    const attrib = parseAllAttribs(product.allAttrib)
    const folder = {
      ...product.folder,
      attrib: parseAllAttribs(product.folder.allAttrib),
    }
    // detect hero version (negative version indicates hero) and mark it when transforming
    const heroRaw = product.versions.find((v) => Math.sign(v.version) === -1)

    const versions = product.versions
      .filter((v) => Math.sign(v.version) !== -1)
      .map((v) => ({
        ...v,
        heroVersionId: heroRaw && v.version === Math.abs(heroRaw?.version) ? heroRaw.id : undefined,
      }))

    return {
      ...product,
      attrib,
      folder,
      versions: versions,
      featuredVersion: transformProductVersionToExtendedVersion(product),
    }
  })

  // filter out products with no featured version
  const productsWithFeaturedVersion = products.filter(
    (p) => p.featuredVersion !== null,
  ) as ProductNode[]

  return { pageInfo, products: productsWithFeaturedVersion }
}

export const parseGQLErrorMessage = (error: string): string => {
  try {
    // First, try to extract the JSON part after the initial error message
    const jsonMatch = error.match(/:\s*({.*})$/)
    if (!jsonMatch) {
      // If no JSON found, return the string before any colon
      return error.split(':')[0] || error
    }

    const jsonString = jsonMatch[1]
    const parsed = JSON.parse(jsonString)

    // Extract detailed error information from nested structure
    if (parsed.response?.errors?.[0]) {
      const errorObj = parsed.response.errors[0]
      const message = errorObj.message || 'Unknown error'
      const path = errorObj.path?.join('.') || ''
      const location = errorObj.locations?.[0]
        ? `Line ${errorObj.locations[0].line}, Column ${errorObj.locations[0].column}`
        : ''

      // Build a detailed error string
      const details = [message, path && `Path: ${path}`, location && `Location: ${location}`]
        .filter(Boolean)
        .join(' | ')

      return details
    }

    return error
  } catch {
    // If parsing fails, return the part before the colon
    return error.split(':')[0] || error
  }
}
