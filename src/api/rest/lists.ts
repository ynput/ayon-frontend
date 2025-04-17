import { RestAPI as api } from '../../services/ayon'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    createEntityList: build.mutation<CreateEntityListApiResponse, CreateEntityListApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/lists`,
        method: 'POST',
        body: queryArg.entityListModel,
        headers: {
          'x-sender': queryArg['x-sender'],
          'x-sender-type': queryArg['x-sender-type'],
        },
      }),
    }),
  }),
  overrideExisting: false,
})
export { injectedRtkApi as api }
export type CreateEntityListApiResponse = /** status 201 Successful Response */ EntityListSummary
export type CreateEntityListApiArg = {
  projectName: string
  'x-sender'?: string
  'x-sender-type'?: string
  entityListModel: EntityListModel
}
export type EntityListSummary = {
  id: string
  /** Type of the entity list */
  entityListType?: string
  label: string
  folders?: number
  tasks?: number
  products?: number
  versions?: number
  representations?: number
  workfiles?: number
}
export type ValidationError = {
  loc: (string | number)[]
  msg: string
  type: string
}
export type HttpValidationError = {
  detail?: ValidationError[]
}
export type ListAccessLevel = 10 | 20 | 30 | 40
export type EntityListItemModel = {
  id?: string
  /** Position of the item in the list */
  position?: number
  /** Label of the item */
  label?: string
  /** Overrides of the listed entity attributes */
  attrib?: Record<string, any>
  /** Additional data associated with the item */
  data?: Record<string, any>
  /** Tags associated with the item */
  tags?: string[]
  /** Name of the user who created the item */
  createdBy?: string
  /** Name of the user who last updated the item */
  updatedBy?: string
  /** Timestamp of when the item was created */
  createdAt?: string
  /** Timestamp of when the item was last updated */
  updatedAt?: string
  /** Type of the list item entity */
  entityType: 'folder' | 'product' | 'version' | 'representation' | 'task' | 'workfile'
  /** ID of the list item entity */
  entityId: string
}
export type EntityListConfig = {
  /** Entity types that can be included in the list */
  entityTypes?: ('folder' | 'product' | 'version' | 'representation' | 'task' | 'workfile')[]
}
export type EntityListModel = {
  id?: string
  /** Type of the entity list */
  entityListType?: string
  label?: string
  tags?: string[]
  /** Access control for the list.  be specified for individual users or teams. */
  access?: {
    [key: string]: ListAccessLevel
  }
  attrib?: object
  data?: object
  template?: object
  /** Name of the user who created the list */
  owner?: string
  items?: EntityListItemModel[]
  config?: EntityListConfig
  /** Name of the user who created the list */
  createdBy?: string
  /** Name of the user who updated the list */
  updatedBy?: string
}
