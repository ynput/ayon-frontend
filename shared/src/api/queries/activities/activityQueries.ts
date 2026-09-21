export type BaseTypes = {
  id: string
  name: string
  status: string
  thumbnailId: string
  thumbnailHash?: string
  updatedAt: string
}

export type TaskTypes = {
  label?: string
  assignees?: Array<string>
  taskType?: string
  folder?: {
    name: string
    label: string
    path: string
  }
}

export type VersionTypes = {
  author?: string
  product?: {
    name: string
    productType: string
    folder?: {
      path: string
    }
  }
}

export type FolderTypes = {
  label?: string
  folderType?: string
  parents?: Array<string>
}

export type WorkfileTypes = {
  task?: {
    name: string
    label?: string
    taskType?: string
    folder?: {
      path: string
    }
  }
}

export type EntityTooltipQuery = {
  data: {
    project: {
      task?: BaseTypes & TaskTypes
      version?: BaseTypes & VersionTypes
      folder?: BaseTypes & FolderTypes
      workfile?: BaseTypes & WorkfileTypes
    }
  }
}

export const getTypeFields = (type: string): string => {
  switch (type) {
    case 'task':
      return `
        label
        assignees
        taskType
        folder {
          name
          label
          path
        }  
      `
    case 'version':
      return `
        author
        product {
          name
          productType
          folder {
            path
          }
        }
      `
    case 'folder':
      return `
        label
        folderType
        parents
      `
    case 'workfile':
      return `
        task {
          name
          label
          taskType
          folder {
            path
          }
        }
      `
    default:
      return ''
  }
}

export const ENTITY_TOOLTIP = (type: string): string => `
query EntityTooltip($projectName: String!, $entityId: String!) {
  project(name: $projectName) {
    ${type}(id: $entityId) {
      id
      name
      status
      thumbnailId
      updatedAt
      thumbnailHash
      ${getTypeFields(type)}
    }
  }
}
`
