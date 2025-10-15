import { GetVersionsQuery } from '@shared/api/generated'
import {
  GetVersionsResult,
  VersionInfiniteResult,
  VersionNode,
  VersionNodeRAW,
} from './getVersions'
import { parseAllAttribs } from '../overview'

// TAGS
const VERSION_TYPE = 'version' as const
const versionsListTag = { type: VERSION_TYPE, id: 'LIST' }
export const provideTagsForVersions = (result: VersionNode[] | undefined) => {
  return result
    ? [
        ...result.map((version) => ({ type: VERSION_TYPE, id: version.id } as const)),
        versionsListTag,
      ]
    : [versionsListTag]
}

export const provideTagsForVersionsResult = (result: GetVersionsResult | undefined) => {
  if (!result) return provideTagsForVersions(undefined)
  return provideTagsForVersions(result.versions)
}

export const provideTagsForVersionsInfinite = (result: VersionInfiniteResult) => {
  if (!result) return provideTagsForVersions(undefined)
  return provideTagsForVersions(flattenInfiniteVersionsData(result))
}

// TRANSFORMERS
export const flattenInfiniteVersionsData = (data: VersionInfiniteResult): VersionNode[] => {
  if (!data) return []
  return data.pages.flatMap((page) => page.versions)
}

export const transformVersionNode = (node: VersionNodeRAW): VersionNode => {
  const attrib = parseAllAttribs(node.allAttrib)
  return { ...node, attrib }
}

export const transformVersionsResponse = (response: GetVersionsQuery): GetVersionsResult => {
  const pageInfo = response.project.versions.pageInfo
  const versions = response.project.versions.edges.map((edge) => transformVersionNode(edge.node))
  return { pageInfo, versions }
}
