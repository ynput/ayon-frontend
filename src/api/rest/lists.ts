import { RestAPI as api } from '../../services/ayon'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    createEntityListItem: build.mutation<
      CreateEntityListItemApiResponse,
      CreateEntityListItemApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/lists/${queryArg.listId}/items`,
        method: 'POST',
        body: queryArg.entityListItemPostModel,
        headers: {
          'x-sender': queryArg['x-sender'],
          'x-sender-type': queryArg['x-sender-type'],
        },
      }),
    }),
    deleteEntityListItem: build.mutation<
      DeleteEntityListItemApiResponse,
      DeleteEntityListItemApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/lists/${queryArg.listId}/items/${queryArg.listItemId}`,
        method: 'DELETE',
        headers: {
          'x-sender': queryArg['x-sender'],
          'x-sender-type': queryArg['x-sender-type'],
        },
      }),
    }),
    updateEntityListItem: build.mutation<
      UpdateEntityListItemApiResponse,
      UpdateEntityListItemApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/lists/${queryArg.listId}/items/${queryArg.listItemId}`,
        method: 'PATCH',
        body: queryArg.entityListItemPatchModel,
        headers: {
          'x-sender': queryArg['x-sender'],
          'x-sender-type': queryArg['x-sender-type'],
        },
      }),
    }),
    createEntityList: build.mutation<CreateEntityListApiResponse, CreateEntityListApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/lists`,
        method: 'POST',
        body: queryArg.entityListPostModel,
        headers: {
          'x-sender': queryArg['x-sender'],
          'x-sender-type': queryArg['x-sender-type'],
        },
      }),
    }),
    getEntityList: build.query<GetEntityListApiResponse, GetEntityListApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/lists/${queryArg.listId}`,
      }),
    }),
    deleteEntityList: build.mutation<DeleteEntityListApiResponse, DeleteEntityListApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/lists/${queryArg.listId}`,
        method: 'DELETE',
      }),
    }),
    updateEntityList: build.mutation<UpdateEntityListApiResponse, UpdateEntityListApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/lists/${queryArg.listId}`,
        method: 'PATCH',
        body: queryArg.entityListPatchModel,
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
export type CreateEntityListItemApiResponse = /** status 201 Successful Response */ any
export type CreateEntityListItemApiArg = {
  listId: string
  projectName: string
  'x-sender'?: string
  'x-sender-type'?: string
  entityListItemPostModel: EntityListItemPostModel
}
export type DeleteEntityListItemApiResponse = /** status 200 Successful Response */ any
export type DeleteEntityListItemApiArg = {
  listId: string
  listItemId: string
  projectName: string
  'x-sender'?: string
  'x-sender-type'?: string
}
export type UpdateEntityListItemApiResponse = /** status 200 Successful Response */ any
export type UpdateEntityListItemApiArg = {
  listId: string
  listItemId: string
  projectName: string
  'x-sender'?: string
  'x-sender-type'?: string
  entityListItemPatchModel: EntityListItemPatchModel
}
export type CreateEntityListApiResponse = /** status 201 Successful Response */ EntityListSummary
export type CreateEntityListApiArg = {
  projectName: string
  'x-sender'?: string
  'x-sender-type'?: string
  entityListPostModel: EntityListPostModel
}
export type GetEntityListApiResponse = /** status 200 Successful Response */ EntityListModel
export type GetEntityListApiArg = {
  listId: string
  projectName: string
}
export type DeleteEntityListApiResponse = /** status 200 Successful Response */ any
export type DeleteEntityListApiArg = {
  listId: string
  projectName: string
}
export type UpdateEntityListApiResponse = /** status 200 Successful Response */ any
export type UpdateEntityListApiArg = {
  listId: string
  projectName: string
  'x-sender'?: string
  'x-sender-type'?: string
  entityListPatchModel: EntityListPatchModel
}
export type ValidationError = {
  loc: (string | number)[]
  msg: string
  type: string
}
export type HttpValidationError = {
  detail?: ValidationError[]
}
export type EntityListItemPostModel = {
  id?: string
  /** ID of the entity in the list */
  entityId: string
  /** Position of the item in the list */
  position: number
  /** Label of the item */
  label?: string
  /** Overrides of the listed entity attributes */
  attrib?: object
  /** Additional data associated with the item */
  data?: object
  /** Tags associated with the item */
  tags?: string[]
}
export type EntityListItemPatchModel = {
  /** ID of the entity in the list */
  entityId?: string
  /** Position of the item in the list */
  position?: number
  /** Label of the item */
  label?: string
  /** Overrides of the listed entity attributes */
  attrib?: object
  /** Additional data associated with the item */
  data?: object
  /** Tags associated with the item */
  tags?: string[]
}
export type EntityListSummary = {
  id?: string
  /** Type of the list */
  entityListType: string
  /** Type of the entity that can be included in the list */
  entityType: 'folder' | 'product' | 'version' | 'representation' | 'task' | 'workfile'
  label: string
  count?: number
}
export type ListAccessLevel = 10 | 20 | 30 | 40
export type EntityListPostModel = {
  id?: string
  /** Type of the list */
  entityListType?: string
  /** Type of the entity that can be included in the list */
  entityType: 'folder' | 'product' | 'version' | 'representation' | 'task' | 'workfile'
  label: string
  /** Access control for the list. Can be specified for users or teams. */
  access?: {
    [key: string]: ListAccessLevel
  }
  /** List attributes */
  attrib?: object
  /** Additional data associated with the list */
  data?: object
  template?: object
  /** List tags */
  tags?: string[]
  /** Name of the user who created the list */
  owner?: string
  /** Whether the list is active or not */
  active?: boolean
  items?: EntityListItemPostModel[]
}
export type EntityListItemModel = {
  id?: string
  /** ID of the entity in the list */
  entityId: string
  /** Position of the item in the list */
  position: number
  /** Label of the item */
  label?: string
  /** Overrides of the listed entity attributes */
  attrib?: object
  /** Additional data associated with the item */
  data?: object
  /** Tags associated with the item */
  tags?: string[]
  /** Path to the folder where the item is located */
  folderPath: string
  createdBy?: string
  updatedBy?: string
  createdAt?: string
  updatedAt?: string
}
export type EntityListModel = {
  id?: string
  /** Type of the list */
  entityListType: string
  /** Type of the entity that can be included in the list */
  entityType: 'folder' | 'product' | 'version' | 'representation' | 'task' | 'workfile'
  label: string
  /** Access control for the list. Can be specified for users or teams. */
  access?: {
    [key: string]: ListAccessLevel
  }
  /** List attributes */
  attrib?: object
  /** Additional data associated with the list */
  data?: object
  template?: object
  /** List tags */
  tags?: string[]
  items?: EntityListItemModel[]
  /** Name of the user who created the list */
  owner?: string
  createdBy?: string
  updatedBy?: string
  createdAt?: string
  updatedAt?: string
  /** Whether the list is active or not */
  active: boolean
}
export type EntityListPatchModel = {
  label?: string
  /** Access control for the list. Can be specified for users or teams. */
  access?: {
    [key: string]: ListAccessLevel
  }
  /** List attributes */
  attrib?: object
  /** Additional data associated with the list */
  data?: object
  /** List tags */
  tags?: string[]
  /** Name of the user who created the list */
  owner?: string
  /** Whether the list is active or not */
  active?: boolean
}
