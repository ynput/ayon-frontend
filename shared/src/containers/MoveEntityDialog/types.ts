export type EntityMoveType = 'folder' | 'task'

export interface EntityMoveData {
  entityId: string
  entityType: EntityMoveType
  name?: string
  currentParentId?: string
}

export interface MultiEntityMoveData {
  entities: EntityMoveData[]
}

export type OnMoveComplete = (targetFolderId: string) => void

export type OpenMoveDialog = (data: EntityMoveData | MultiEntityMoveData) => void
