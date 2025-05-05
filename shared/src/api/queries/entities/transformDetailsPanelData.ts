import {
  DetailsPanelFolderFragmentFragment,
  DetailsPanelProductFragmentFragment,
  DetailsPanelRepresentationFragmentFragment,
  DetailsPanelTaskFragmentFragment,
  DetailsPanelVersionFragmentFragment,
  GetDetailsPanelFolderQuery,
  GetDetailsPanelRepresentationQuery,
  GetDetailsPanelTaskQuery,
  GetDetailsPanelVersionQuery,
} from '@shared/api/generated'
import { parseAttribs } from '@shared/api'

type DetailsPanelTask = NonNullable<GetDetailsPanelTaskQuery['project']['task']>
type DetailsPanelRepresentation = NonNullable<
  GetDetailsPanelRepresentationQuery['project']['representation']
>
type DetailsPanelVersion = NonNullable<GetDetailsPanelVersionQuery['project']['version']>
type DetailsPanelFolder = NonNullable<GetDetailsPanelFolderQuery['project']['folder']>

export const detailsPanelEntityTypes = ['task', 'version', 'folder', 'representation'] as const
export type DetailsPanelEntityType = (typeof detailsPanelEntityTypes)[number]

type TransformEntityDataArgs = {
  entity: DetailsPanelRepresentation | DetailsPanelTask | DetailsPanelVersion | DetailsPanelFolder
  entityType: DetailsPanelEntityType
  projectName: string
}

type NullableString = string | null | undefined

// return type
export type DetailsPanelEntityData = {
  id: string
  name: string
  label: NullableString
  tags: string[]
  status: string
  updatedAt: string
  createdAt: string
  attrib: Record<string, string | number>
  hasReviewables?: boolean
  thumbnailId?: string | null | undefined
  // extra metadata
  entityType: string
  projectName: string
  // type specific
  task?: DetailsPanelTaskFragmentFragment
  folder?: DetailsPanelFolderFragmentFragment
  product?: DetailsPanelProductFragmentFragment
  version?: DetailsPanelVersionFragmentFragment
  representations?: DetailsPanelRepresentationFragmentFragment[]
}

// takes the data from different entity types and returns a single data model
export const transformDetailsPanelQueriesData = ({
  entity,
  entityType,
  projectName,
}: TransformEntityDataArgs): DetailsPanelEntityData => {
  switch (entityType) {
    case 'task':
      const task = entity as DetailsPanelTask
      return {
        entityType: 'task',
        projectName: projectName,
        id: task.id,
        name: task.name,
        label: task.label,
        tags: task.tags,
        status: task.status,
        updatedAt: task.updatedAt,
        createdAt: task.createdAt,
        attrib: parseAttribs(task.allAttrib),
        hasReviewables: task.hasReviewables,
        thumbnailId: task.thumbnailId,
        folder: task.folder,
        task: {
          id: task.id,
          name: task.name,
          label: task.label,
          assignees: task.assignees,
          taskType: task.taskType,
        },
        product: undefined,
        version: task.versions?.edges?.[0]?.node,
      }
    case 'version':
      const version = entity as DetailsPanelVersion
      return {
        entityType: 'version',
        projectName: projectName,
        id: version.id,
        name: version.name,
        label: undefined,
        tags: version.tags,
        status: version.status,
        updatedAt: version.updatedAt,
        createdAt: version.createdAt,
        attrib: parseAttribs(version.allAttrib),
        hasReviewables: version.hasReviewables,
        thumbnailId: version.thumbnailId,
        folder: version.product?.folder,
        product: {
          id: version.product?.id,
          name: version.product?.name,
          productType: version.product?.productType,
        },
        representations: version.representations?.edges?.map((edge) => edge.node) || [],
      }
    case 'folder':
      const folder = entity as DetailsPanelFolder
      return {
        entityType: 'folder',
        projectName: projectName,
        id: folder.id,
        name: folder.name,
        label: folder.label,
        tags: folder.tags,
        status: folder.status,
        updatedAt: folder.updatedAt,
        createdAt: folder.createdAt,
        attrib: parseAttribs(folder.allAttrib),
        hasReviewables: folder.hasReviewables,
        thumbnailId: folder.thumbnailId,
        folder: {
          id: folder.id,
          name: folder.name,
          label: folder.label,
          folderType: folder.folderType,
        },
        product: undefined,
        version: undefined,
        representations: undefined,
      }
    case 'representation':
      const representation = entity as DetailsPanelRepresentation
      return {
        entityType: 'representation',
        projectName: projectName,
        id: representation.id,
        name: representation.name,
        label: undefined,
        tags: representation.tags,
        status: representation.status,
        updatedAt: representation.updatedAt,
        createdAt: representation.createdAt,
        attrib: parseAttribs(representation.allAttrib),
        hasReviewables: undefined,
        thumbnailId: undefined,
        version: representation.version,
        product: representation.version.product,
        task: representation.version.task || undefined,
        folder: representation.version.product?.folder,
        representations: undefined,
      }
  }
}
