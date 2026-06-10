import type { FilterFieldType, ScopeWithFilterTypes } from '@shared/components'

type ScopeType = ScopeWithFilterTypes['scope']

const BASE: FilterFieldType[] = ['status', 'tags', 'attributes', 'createdAt', 'updatedAt']

// Single source of truth for which filter options each entity scope offers.
// Pages differ only by which scopes they include, never by the field list per scope.
export const FILTER_TYPES_BY_SCOPE: Record<ScopeType, FilterFieldType[]> = {
  folder: [...BASE, 'name', 'folderType'],
  task: [...BASE, 'name', 'taskType', 'folderType', 'assignees'],
  version: [
    ...BASE,
    'productType',
    'productBaseType',
    'author',
    'version',
    'hasReviewables',
    'taskType',
    'folderType',
  ],
  product: [...BASE, 'productName', 'productBaseType'],
  user: [...BASE],
}

// exclude lets a page subtract fields its backend endpoint cannot filter by,
// but never add page-specific ones — additions belong in FILTER_TYPES_BY_SCOPE.
export const buildScopes = (
  scopes: ScopeType[],
  exclude?: Partial<Record<ScopeType, FilterFieldType[]>>,
): ScopeWithFilterTypes[] =>
  scopes.map((scope) => ({
    scope,
    filterTypes: FILTER_TYPES_BY_SCOPE[scope].filter((t) => !exclude?.[scope]?.includes(t)),
  }))
