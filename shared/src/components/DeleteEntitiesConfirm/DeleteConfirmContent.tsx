import styled from 'styled-components'
import { pluralize } from '@shared/util'
import type { FolderDeleteInfo } from '@shared/api'
import type {
  DeletableEntity,
  DeletableEntityType,
} from '@shared/context/DeleteEntitiesContext'

const TYPE_ORDER: DeletableEntityType[] = [
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
  const parts = TYPE_ORDER.filter((type) => counts[type] > 0).map((type) =>
    pluralize(counts[type], type),
  )
  return joinNatural(parts)
}

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

  return details
}

const Wrapper = styled.div`
  min-width: 350px;
`
const DetailsContainer = styled.div`
  margin-top: 12px;
  min-height: 60px;
  min-width: 350px;
`
const BoldLabel = styled.p`
  font-weight: 600;
`

export type DeleteConfirmContentProps = {
  entityLabel: string
  childrenDetails: string[]
}

export const DeleteConfirmContent = ({
  entityLabel,
  childrenDetails,
}: DeleteConfirmContentProps) => (
  <Wrapper>
    <p>{`Are you sure you want to delete ${entityLabel}? This action cannot be undone.`}</p>
    {childrenDetails.length > 0 && (
      <DetailsContainer>
        <BoldLabel>The following will also be affected:</BoldLabel>
        {childrenDetails.map((detail, i) => (
          <p key={i}>{detail}</p>
        ))}
      </DetailsContainer>
    )}
  </Wrapper>
)
