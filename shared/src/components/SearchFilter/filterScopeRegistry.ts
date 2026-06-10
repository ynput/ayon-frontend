import { FilterFieldType, ScopeWithFilterTypes } from './useBuildFilterOptions'

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

export const buildScopes = (scopes: ScopeType[]): ScopeWithFilterTypes[] =>
  scopes.map((scope) => ({ scope, filterTypes: FILTER_TYPES_BY_SCOPE[scope] }))
