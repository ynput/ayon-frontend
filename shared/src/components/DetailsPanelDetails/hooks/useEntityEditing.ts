import { useMemo } from 'react'
import { useEntityUpdate } from '@shared/hooks/useEntityUpdate'
import { useGetMyPermissionsQuery } from '@shared/api'
import type { DetailsPanelEntityData } from '@shared/api'

interface UseEntityEditingProps {
  entities: DetailsPanelEntityData[]
  entityType: string
}

export type AttribAccess = {
  readableAttributes?: string[]
  writableAttributes?: string[]
  writableFields?: string[]
}

const allowedByAll = (lists: (string[] | undefined)[]) =>
  lists.reduce<string[] | undefined>(
    (allowed, list) =>
      !list ? allowed : !allowed ? list : allowed.filter((i) => list.includes(i)),
    undefined,
  )

export const useEntityEditing = ({ entities, entityType }: UseEntityEditingProps) => {
  const enableEditing = true

  const { data: permissions } = useGetMyPermissionsQuery()
  const attribAccess = useMemo((): AttribAccess => {
    if (!permissions?.projects) return {}
    const projects = [...new Set(entities.map((entity) => entity.projectName))].map(
      (projectName) => permissions.projects?.[projectName] || {},
    )
    const reads = projects.map((project) => project.attrib_read)
    const writes = projects.map((project) => project.attrib_write)

    return {
      readableAttributes: allowedByAll(
        reads.map((r) => (r?.enabled ? r.attributes ?? [] : undefined)),
      ),
      writableAttributes: allowedByAll(
        writes.map((w) => (w?.enabled ? w.attributes ?? [] : undefined)),
      ),
      writableFields: allowedByAll(writes.map((w) => (w?.enabled ? w.fields ?? [] : undefined))),
    }
  }, [permissions, entities])

  const { updateEntity } = useEntityUpdate({
    entities: entities.map((entity) => ({
      id: entity.id,
      projectName: entity.projectName || '',
      folderId: entity.folder?.id,
      productId: entity.product?.id,
      users: entity.task?.assignees || [],
    })),
    entityType,
  })

  return {
    enableEditing,
    attribAccess,
    updateEntity,
  }
}
