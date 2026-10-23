import type { ListsMembershipEntityType } from '@shared/api/queries/entityLists/getListsMembership'
import { LISTS_COLUMN_ID, REVIEW_SESSIONS_COLUMN_ID } from '../constants'

type ListColumnConfig = {
  label: string
  icon: string
  listType: string
  entityTypes: ListsMembershipEntityType[]
}

export const LIST_COLUMNS: Record<string, ListColumnConfig> = {
  [LISTS_COLUMN_ID]: {
    label: 'Lists',
    icon: 'list_alt',
    listType: 'generic',
    entityTypes: ['folder', 'task', 'version'],
  },
  [REVIEW_SESSIONS_COLUMN_ID]: {
    label: 'Review sessions',
    icon: 'subscriptions',
    listType: 'review-session',
    entityTypes: ['version'],
  },
}

export const LIST_COLUMN_IDS = Object.keys(LIST_COLUMNS)

export const isListColumnEntityType = (
  columnId: string,
  entityType?: string,
): entityType is ListsMembershipEntityType =>
  !!LIST_COLUMNS[columnId]?.entityTypes.includes(entityType as ListsMembershipEntityType)
