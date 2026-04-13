import type { SearchEntityLink } from '@shared/api'
import { buildEntityUri, extractEntityHierarchyFromParents, getEntityTypeIcon } from '@shared/util'
import { getEntityColor, getEntityIcon, type IconAnatomy } from '@shared/util/iconUtils'
import type { GlobalSearchEntityType, GlobalSearchResult } from './types'

const globalSearchEntityTypes: GlobalSearchEntityType[] = ['folder', 'task', 'product', 'version']

const globalSearchTypeBias: Record<GlobalSearchEntityType, number> = {
  folder: 14,
  task: 8,
  product: 3,
  version: 1,
}

const globalSearchTypePriority: Record<GlobalSearchEntityType, number> = {
  folder: 3,
  task: 2,
  product: 1,
  version: 0,
}

const defaultGlobalProjectSearchLimit = 10
const whitespaceRegex = /\s+/g
const separatorRegex = /[_-]+/g

export type GlobalSearchEntity = SearchEntityLink & {
  entityType: GlobalSearchEntityType
}

export const normalizeGlobalSearchValue = (value?: string) =>
  (value || '').trim().toLowerCase().replace(separatorRegex, ' ').replace(whitespaceRegex, ' ')

export const isUsableGlobalSearch = (projectName?: string, search?: string) =>
  Boolean(projectName?.trim() && normalizeGlobalSearchValue(search))

export const isEntityUriSearch = (value?: string) =>
  Boolean(value?.trim().toLowerCase().startsWith('ayon+entity://'))

export const isGlobalSearchEntityType = (value: string): value is GlobalSearchEntityType =>
  globalSearchEntityTypes.includes(value as GlobalSearchEntityType)

export const sanitizeGlobalSearchLimit = (limit?: number) => {
  if (!limit || limit < 1) return defaultGlobalProjectSearchLimit
  return Math.floor(limit)
}

const tokenizeGlobalSearchValue = (value: string) =>
  normalizeGlobalSearchValue(value)
    .split(' ')
    .map((token) => token.trim())
    .filter(Boolean)

const getOrderedTokenBonus = (tokens: string[], haystack: string) => {
  let lastIndex = -1
  let orderedMatches = 0

  for (const token of tokens) {
    const index = haystack.indexOf(token, lastIndex + 1)
    if (index === -1) break
    orderedMatches += 1
    lastIndex = index
  }

  return orderedMatches === tokens.length ? 12 : orderedMatches * 3
}

const getTokenCoverageScore = (tokens: string[], haystack: string) => {
  if (!tokens.length || !haystack) return 0

  const matchedTokens = tokens.filter((token) => haystack.includes(token))
  if (!matchedTokens.length) return 0

  const matchedLength = matchedTokens.reduce((total, token) => total + token.length, 0)
  const coverageRatio = matchedLength / Math.max(haystack.length, 1)

  return matchedTokens.length * 14 + coverageRatio * 24 + getOrderedTokenBonus(tokens, haystack)
}

const getWordPrefixScore = (query: string, haystack: string) => {
  if (!query || !haystack) return 0

  const queryTokens = tokenizeGlobalSearchValue(query)
  const haystackTokens = tokenizeGlobalSearchValue(haystack)
  if (!queryTokens.length || !haystackTokens.length) return 0

  let matchedPrefixes = 0
  for (const queryToken of queryTokens) {
    if (haystackTokens.some((haystackToken) => haystackToken.startsWith(queryToken))) {
      matchedPrefixes += 1
    }
  }

  if (!matchedPrefixes) return 0

  return (matchedPrefixes / queryTokens.length) * 48
}

export const getGlobalSearchPathLabel = (entity: Pick<GlobalSearchEntity, 'parents' | 'label' | 'name'>) =>
  [...(entity.parents || []), entity.label || entity.name].filter(Boolean).join(' / ')

const getTextMatchScore = (search: string, value?: string) => {
  const normalizedSearch = normalizeGlobalSearchValue(search)
  const normalizedValue = normalizeGlobalSearchValue(value)

  if (!normalizedSearch || !normalizedValue) return 0

  if (normalizedValue === normalizedSearch) return 150
  if (normalizedValue.startsWith(`${normalizedSearch} `)) return 130

  const phraseIndex = normalizedValue.indexOf(normalizedSearch)
  if (phraseIndex !== -1) {
    return Math.max(84, 118 - phraseIndex)
  }

  const tokenScore = getTokenCoverageScore(tokenizeGlobalSearchValue(normalizedSearch), normalizedValue)
  const prefixScore = getWordPrefixScore(normalizedSearch, normalizedValue)

  return tokenScore + prefixScore
}

export const scoreGlobalSearchEntity = (
  search: string,
  entity: Pick<GlobalSearchEntity, 'entityType' | 'name' | 'label' | 'parents' | 'subType'>,
) => {
  const nameScore = getTextMatchScore(search, entity.name)
  const labelScore = getTextMatchScore(search, entity.label)
  const parentsLabel = (entity.parents || []).join(' / ')
  const pathLabel = getGlobalSearchPathLabel(entity)
  const parentsScore = getTextMatchScore(search, parentsLabel)
  const pathScore = getTextMatchScore(search, pathLabel)
  const subTypeScore = getTextMatchScore(search, entity.subType)

  return Math.round(
    nameScore * 1.35 +
      labelScore * 1.2 +
      pathScore * 0.75 +
      parentsScore * 0.45 +
      subTypeScore * 0.2 +
      globalSearchTypeBias[entity.entityType],
  )
}

export const buildGlobalSearchTargetUrl = (
  projectName: string,
  entityType: GlobalSearchEntityType,
  id: string,
  uri?: string,
  targetEntityType?: string,
  targetEntityId?: string,
) => {
  const searchParams = new URLSearchParams({
    project: projectName,
    type: entityType,
    id,
  })

  if (uri) {
    searchParams.set('uri', uri)
  }

  if (
    targetEntityType &&
    targetEntityId &&
    (targetEntityType !== entityType || targetEntityId !== id)
  ) {
    searchParams.set('targetType', targetEntityType)
    searchParams.set('targetId', targetEntityId)
  }

  const module = entityType === 'product' || entityType === 'version' ? 'products' : 'overview'
  return `/projects/${projectName}/${module}?${searchParams.toString()}`
}

const buildGlobalSearchThumbnailUrl = (
  projectName: string,
  entity: Pick<
    GlobalSearchEntity,
    'entityType' | 'id' | 'thumbnailId' | 'targetEntityType' | 'targetEntityId' | 'updatedAt'
  >,
) => {
  if (entity.entityType === 'folder') {
    if (!entity.thumbnailId) return undefined
    return `/api/projects/${projectName}/folders/${entity.id}/thumbnail`
  }

  if (entity.entityType === 'task') {
    const updatedAt = entity.updatedAt ? `?updatedAt=${entity.updatedAt}` : ''
    return `/api/projects/${projectName}/tasks/${entity.id}/thumbnail${updatedAt}`
  }

  if (entity.entityType === 'product' && entity.targetEntityType === 'version' && entity.targetEntityId) {
    return `/api/projects/${projectName}/versions/${entity.targetEntityId}/thumbnail`
  }

  if (entity.entityType === 'version') {
    const updatedAt = entity.updatedAt ? `?updatedAt=${entity.updatedAt}` : ''
    return `/api/projects/${projectName}/versions/${entity.id}/thumbnail${updatedAt}`
  }

  if (!entity.thumbnailId) return undefined
  return `/api/projects/${projectName}/thumbnails/${entity.thumbnailId}`
}

export const buildGlobalSearchResult = ({
  entity,
  projectName,
  search,
  anatomy,
}: {
  entity: GlobalSearchEntity
  projectName: string
  search: string
  anatomy: IconAnatomy
}): GlobalSearchResult => {
  const hierarchy = extractEntityHierarchyFromParents(entity.parents || [], entity.entityType, entity.name)
  const pathLabel = getGlobalSearchPathLabel(entity)
  const thumbnailId = entity.thumbnailId || entity.thumbnail?.id || undefined
  const thumbnailUrl = buildGlobalSearchThumbnailUrl(projectName, { ...entity, thumbnailId })

  return {
    id: entity.id,
    projectName,
    entityType: entity.entityType,
    targetEntityType: isGlobalSearchEntityType(entity.targetEntityType || '')
      ? entity.targetEntityType
      : undefined,
    targetEntityId: entity.targetEntityId,
    name: entity.name,
    label: entity.label || entity.name,
    parents: entity.parents || [],
    subType: entity.subType || undefined,
    icon: getEntityIcon(entity.entityType, entity.subType, anatomy) || getEntityTypeIcon(entity.entityType),
    iconColor: getEntityColor(entity.entityType, entity.subType, anatomy),
    thumbnailId,
    thumbnailUrl,
    pathLabel,
    uri: buildEntityUri({ projectName, ...hierarchy }),
    targetUrl: buildGlobalSearchTargetUrl(
      projectName,
      entity.entityType,
      entity.id,
      buildEntityUri({ projectName, ...hierarchy }),
      entity.targetEntityType,
      entity.targetEntityId,
    ),
    score: scoreGlobalSearchEntity(search, entity),
  }
}

export const rankGlobalSearchResults = ({
  entities,
  projectName,
  search,
  limit,
  anatomy,
}: {
  entities: GlobalSearchEntity[]
  projectName: string
  search: string
  limit?: number
  anatomy: IconAnatomy
}) => {
  const usableSearch = normalizeGlobalSearchValue(search)
  if (!usableSearch) return []

  return entities
    .map((entity) => buildGlobalSearchResult({ entity, projectName, search: usableSearch, anatomy }))
    .filter((entity) => entity.score > 0)
    .sort(
      (left, right) =>
        right.score - left.score ||
        globalSearchTypePriority[right.entityType] - globalSearchTypePriority[left.entityType] ||
        left.label.localeCompare(right.label),
    )
    .slice(0, sanitizeGlobalSearchLimit(limit))
}
