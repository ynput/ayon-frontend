import { api } from '@shared/api/base'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    getEntityListAttributesDefinition: build.query<
      GetEntityListAttributesDefinitionApiResponse,
      GetEntityListAttributesDefinitionApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/lists/${queryArg.listId}/attributes`,
      }),
    }),
    setEntityListAttributesDefinition: build.mutation<
      SetEntityListAttributesDefinitionApiResponse,
      SetEntityListAttributesDefinitionApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/lists/${queryArg.listId}/attributes`,
        method: 'PUT',
        body: queryArg.payload,
      }),
    }),
    getListEntities: build.query<GetListEntitiesApiResponse, GetListEntitiesApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/lists/${queryArg.listId}/entities`,
      }),
    }),
    getEntityListFolders: build.query<GetEntityListFoldersApiResponse, GetEntityListFoldersApiArg>({
      query: (queryArg) => ({ url: `/api/projects/${queryArg.projectName}/entityListFolders` }),
    }),
    createEntityListFolder: build.mutation<
      CreateEntityListFolderApiResponse,
      CreateEntityListFolderApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/entityListFolders`,
        method: 'POST',
        body: queryArg.entityListFolderPostModel,
        headers: {
          'x-sender': queryArg['x-sender'],
          'x-sender-type': queryArg['x-sender-type'],
        },
      }),
    }),
    deleteEntityListFolder: build.mutation<
      DeleteEntityListFolderApiResponse,
      DeleteEntityListFolderApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/entityListFolders/${queryArg.folderId}`,
        method: 'DELETE',
        headers: {
          'x-sender': queryArg['x-sender'],
          'x-sender-type': queryArg['x-sender-type'],
        },
      }),
    }),
    updateEntityListFolder: build.mutation<
      UpdateEntityListFolderApiResponse,
      UpdateEntityListFolderApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/entityListFolders/${queryArg.folderId}`,
        method: 'PATCH',
        body: queryArg.entityListFolderPatchModel,
        headers: {
          'x-sender': queryArg['x-sender'],
          'x-sender-type': queryArg['x-sender-type'],
        },
      }),
    }),
    setEntityListFoldersOrder: build.mutation<
      SetEntityListFoldersOrderApiResponse,
      SetEntityListFoldersOrderApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/entityListFolders/order`,
        method: 'POST',
        body: queryArg.entityListFolderOrderModel,
        headers: {
          'x-sender': queryArg['x-sender'],
          'x-sender-type': queryArg['x-sender-type'],
        },
      }),
    }),
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
    updateEntityListItems: build.mutation<
      UpdateEntityListItemsApiResponse,
      UpdateEntityListItemsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/lists/${queryArg.listId}/items`,
        method: 'PATCH',
        body: queryArg.entityListMultiPatchModel,
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
        params: {
          metadata_only: queryArg.metadataOnly,
        },
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
    materializeEntityList: build.mutation<
      MaterializeEntityListApiResponse,
      MaterializeEntityListApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/lists/${queryArg.listId}/materialize`,
        method: 'POST',
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
export type GetEntityListAttributesDefinitionApiResponse =
  /** status 200 Successful Response */ EntityListAttributeDefinition[]
export type GetEntityListAttributesDefinitionApiArg = {
  listId: string
  projectName: string
}
export type SetEntityListAttributesDefinitionApiResponse = /** status 200 Successful Response */ any
export type SetEntityListAttributesDefinitionApiArg = {
  listId: string
  projectName: string
  payload: EntityListAttributeDefinition[]
}
export type GetListEntitiesApiResponse = /** status 200 Successful Response */ EntityListEnities
export type GetListEntitiesApiArg = {
  listId: string
  projectName: string
}
export type GetEntityListFoldersApiResponse =
  /** status 200 Successful Response */ EntityListFoldersResponseModel
export type GetEntityListFoldersApiArg = {
  projectName: string
}
export type CreateEntityListFolderApiResponse =
  /** status 200 Successful Response */ EntityIdResponse
export type CreateEntityListFolderApiArg = {
  projectName: string
  'x-sender'?: string
  'x-sender-type'?: string
  entityListFolderPostModel: EntityListFolderPostModel
}
export type DeleteEntityListFolderApiResponse = /** status 200 Successful Response */ any
export type DeleteEntityListFolderApiArg = {
  projectName: string
  folderId: string
  'x-sender'?: string
  'x-sender-type'?: string
}
export type UpdateEntityListFolderApiResponse = /** status 200 Successful Response */ any
export type UpdateEntityListFolderApiArg = {
  projectName: string
  folderId: string
  'x-sender'?: string
  'x-sender-type'?: string
  entityListFolderPatchModel: EntityListFolderPatchModel
}
export type SetEntityListFoldersOrderApiResponse = /** status 200 Successful Response */ any
export type SetEntityListFoldersOrderApiArg = {
  projectName: string
  'x-sender'?: string
  'x-sender-type'?: string
  entityListFolderOrderModel: EntityListFolderOrderModel
}
export type CreateEntityListItemApiResponse = /** status 201 Successful Response */ any
export type CreateEntityListItemApiArg = {
  listId: string
  projectName: string
  'x-sender'?: string
  'x-sender-type'?: string
  entityListItemPostModel: EntityListItemPostModel
}
export type UpdateEntityListItemsApiResponse = /** status 200 Successful Response */ any
export type UpdateEntityListItemsApiArg = {
  listId: string
  projectName: string
  'x-sender'?: string
  'x-sender-type'?: string
  entityListMultiPatchModel: EntityListMultiPatchModel
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
  /** When true, only return metadata */
  metadataOnly?: boolean
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
export type MaterializeEntityListApiResponse =
  /** status 200 Successful Response */ EntityListSummary
export type MaterializeEntityListApiArg = {
  listId: string
  projectName: string
  'x-sender'?: string
  'x-sender-type'?: string
}
export type AttributeEnumItem = {
  value: string | number | number | boolean
  label: string
  icon?: string
  color?: string
  /** List of project this item is available on */
  projects?: string[]
}
export type AttributeData = {
  /** Type of attribute value */
  type?:
    | 'string'
    | 'integer'
    | 'float'
    | 'boolean'
    | 'datetime'
    | 'list_of_strings'
    | 'list_of_integers'
    | 'list_of_any'
    | 'list_of_submodels'
    | 'dict'
  /** Nice, human readable title of the attribute */
  title?: string
  description?: string
  /** Example value of the field. */
  example?: any
  /** Default value for the attribute. Do not set for list types. */
  default?: any
  gt?: number | number
  ge?: number | number
  lt?: number | number
  le?: number | number
  minLength?: number
  maxLength?: number
  /** Minimum number of items in list type. */
  minItems?: number
  /** Only for list types. Maximum number of items in the list. */
  maxItems?: number
  /** Only for string types. The value must match this regex. */
  regex?: string
  /** List of enum items used for displaying select widgets */
  enum?: AttributeEnumItem[]
  /** Inherit the attribute value from the parent entity. */
  inherit?: boolean
}
export type EntityListAttributeDefinition = {
  name: string
  data: AttributeData
}
export type ValidationError = {
  loc: (string | number)[]
  msg: string
  type: string
}
export type HttpValidationError = {
  detail?: ValidationError[]
}
export type EntityListEnities = {
  entityType: 'folder' | 'product' | 'version' | 'representation' | 'task' | 'workfile'
  entityIds: string[]
}
export type EntityListFolderData = {
  /** Hex color code */
  color?: string
  /** Icon name */
  icon?: string
  /** Folder scope */
  scope?: string[]
}
export type EntityListFolderModel = {
  id: string
  label: string
  parentId?: string
  position?: number
  owner?: string
  access?: {
    [key: string]: number
  }
  data?: EntityListFolderData
}
export type EntityListFoldersResponseModel = {
  folders?: EntityListFolderModel[]
}
export type EntityIdResponse = {
  /** Entity ID */
  id: string
}
export type EntityListFolderPostModel = {
  id?: string
  label: string
  parentId?: string
  access?: {
    [key: string]: number
  }
  data?: EntityListFolderData
}
export type EntityListFolderPatchModel = {
  label?: string
  parentId?: string
  access?: {
    [key: string]: number
  }
  data?: EntityListFolderData
}
export type EntityListFolderOrderModel = {
  order: string[]
}
export type EntityListItemPostModel = {
  id?: string
  /** ID of the entity in the list */
  entityId: string
  /** Position of the item in the list */
  position?: number
  /** Label of the item */
  label?: string
  /** Overrides of the listed entity attributes */
  attrib?: object
  /** Additional data associated with the item */
  data?: Record<string, any>
  /** Tags associated with the item */
  tags?: string[]
}
export type EntityListMultiPatchItemModel = {
  id?: string
  /** ID of the entity in the list */
  entityId?: string
  /** Position of the item in the list */
  position?: number
  /** Label of the item */
  label?: string
  /** Overrides of the listed entity attributes */
  attrib?: object
  /** Additional data associated with the item */
  data?: Record<string, any>
  /** Tags associated with the item */
  tags?: string[]
}
export type EntityListMultiPatchModel = {
  items?: EntityListMultiPatchItemModel[]
  /** The mode of the operation. `replace` will replace all items with the provided ones. `merge` will merge the provided items with the existing ones.`delete` will delete items with matching ids from the list. */
  mode?: 'replace' | 'merge' | 'delete'
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
  data?: Record<string, any>
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
export type ListAccessLevel = 0 | 10 | 20 | 30
export type EntityListPostModel = {
  id?: string
  /** Type of the list */
  entityListType?: string
  /** ID of the folder containing the list */
  entityListFolderId?: string
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
  data?: Record<string, any>
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
  data?: Record<string, any>
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
  /** ID of the folder containing the list */
  entityListFolderId?: string
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
  data?: Record<string, any>
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
  accessLevel?: ListAccessLevel
}
export type EntityListPatchModel = {
  label?: string
  /** Access control for the list. Can be specified for users or teams. */
  access?: {
    [key: string]: ListAccessLevel
  }
  /** List attributes */
  attrib?: object
  /** ID of the folder containing the list */
  entityListFolderId?: string
  /** Additional data associated with the list */
  data?: Record<string, any>
  /** List tags */
  tags?: string[]
  /** Name of the user who created the list */
  owner?: string
  /** Whether the list is active or not */
  active?: boolean
}
