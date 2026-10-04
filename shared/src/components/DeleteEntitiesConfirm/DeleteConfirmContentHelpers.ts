import { pluralize } from '@shared/util'
import type { FolderDeleteInfo } from '@shared/api'
import type { DeletableEntity, DeletableEntityType } from '@shared/context/DeleteEntitiesContext'
import type { ExpectedDeleteCounts } from './DeleteConfirmContent'

export const DELETE_TYPE_ORDER: DeletableEntityType[] = [
  'folder',
  'task',
  'product',
  'version',
  'representation',
  'workfile',
]

// "5 folders" | "5 folders and 25 tasks" | "5 folders, 1 product and 25 versions"
const joinNatural = (parts: string[]): string => {
  if (parts.length <= 1) return parts.join('')
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`
}

export const buildEntityLabel = (topLevel: DeletableEntity[]): string => {
  if (topLevel.length === 1) {
    const e = topLevel[0]
    return `${e.entityType} "${e.label || e.name || e.id}"`
  }
  const counts: Record<string, number> = {}
  for (const e of topLevel) counts[e.entityType] = (counts[e.entityType] || 0) + 1
  const parts = DELETE_TYPE_ORDER.filter((type) => counts[type] > 0).map((type) =>
    pluralize(counts[type], type),
  )
  return joinNatural(parts)
}

// selected entities plus the descendants a folder delete cascades to — versions cascaded
// from deleted products are not counted, the backend gives no number for them
export const buildExpectedCounts = (
  topLevel: DeletableEntity[],
  folderInfo: FolderDeleteInfo[],
): ExpectedDeleteCounts => {
  const counts: ExpectedDeleteCounts = {}
  const add = (type: DeletableEntityType, amount: number) => {
    if (amount > 0) counts[type] = (counts[type] || 0) + amount
  }

  for (const e of topLevel) add(e.entityType, 1)

  for (const info of folderInfo) {
    add('folder', info.totalFolderCount)
    add('task', info.totalTaskCount)
    add('product', info.totalProductCount)
    add('version', info.totalVersionCount)
  }

  return counts
}

export const sumExpectedCounts = (counts: ExpectedDeleteCounts): number =>
  DELETE_TYPE_ORDER.reduce((total, type) => total + (counts[type] || 0), 0)

const MAX_DETAIL_LINES = 8

export const buildChildrenDetails = (
  topLevelFolders: DeletableEntity[],
  folderInfo: FolderDeleteInfo[],
): string[] => {
  if (topLevelFolders.length === 0) return []
  const folderInfoMap = new Map(folderInfo.map((f) => [f.id, f]))
  const many = topLevelFolders.length > 1
  const details: string[] = []

  for (const folder of topLevelFolders) {
    const info = folderInfoMap.get(folder.id)
    const folderDisplayName = folder.label || folder.name || folder.id
    const prefix = many ? `"${folderDisplayName}" contains ` : 'Contains '
    const hasDescendants =
      info &&
      (info.totalFolderCount > 0 ||
        info.totalTaskCount > 0 ||
        info.totalProductCount > 0 ||
        info.totalVersionCount > 0)

    if (hasDescendants) {
      const parts: string[] = []
      if (info.totalFolderCount > 0) parts.push(pluralize(info.totalFolderCount, 'child folder'))
      if (info.totalTaskCount > 0) parts.push(pluralize(info.totalTaskCount, 'task'))
      if (info.totalProductCount > 0) parts.push(pluralize(info.totalProductCount, 'product'))
      if (info.totalVersionCount > 0) parts.push(pluralize(info.totalVersionCount, 'version'))
      details.push(`${prefix}${parts.join(', ')}`)
    } else {
      if (folder.hasChildren) details.push(`${prefix}child folders`)
      if (folder.taskNames && folder.taskNames.length > 0) {
        details.push(`${prefix}${pluralize(folder.taskNames.length, 'task')}`)
      }
    }
  }

  if (details.length > MAX_DETAIL_LINES) {
    return [...details.slice(0, MAX_DETAIL_LINES), `…and ${details.length - MAX_DETAIL_LINES} more`]
  }

  return details
}
