export type EntityForm = {
  id: string
  name: string
  label: string | null | undefined
  entityType: 'folder' | 'task' | 'product' | 'version'
  taskType?: string
  folderType?: string
  productType?: string
  tags: string[]
  status: string
  updatedAt: string
  createdAt: string
  projectName: string
  path: string
  description?: string
  // attribs
  [key: string]: string | number | boolean | Date | any[] | Record<string, any> | undefined | null
}

export const visibleFields: Array<keyof EntityForm> = [
  'id',
  'name',
  'label',
  'entityType',
  'taskType',
  'folderType',
  'productType',
  'tags',
  'status',
  'updatedAt',
  'updatedBy',
  'createdAt',
  'createdBy',
  'projectName',
  'path',
  'description',
]

export const readOnlyFields: Array<keyof EntityForm> = [
  'id',
  'entityType',
  'projectName',
  'path',
  'createdAt',
  'createdBy',
  'updatedAt',
  'updatedBy',
]

export const attributeFields: Array<keyof EntityForm> = [
  'name',
  'label',
  'taskType',
  'folderType',
  'productType',
  'tags',
  'status',
]
