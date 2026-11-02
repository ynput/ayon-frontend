import { api } from '@shared/api/base'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    getEntityListAttributesDefinition: build.query<
      GetEntityListAttributesDefinitionApiResponse,
      GetEntityListAttributesDefinitionApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/lists/${queryArg.entityListId}/attributes`,
      }),
    }),
    setEntityListAttributesDefinition: build.mutation<
      SetEntityListAttributesDefinitionApiResponse,
      SetEntityListAttributesDefinitionApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/lists/${queryArg.entityListId}/attributes`,
        method: 'PUT',
        body: queryArg.payload,
      }),
    }),
    getListEntities: build.query<GetListEntitiesApiResponse, GetListEntitiesApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/lists/${queryArg.entityListId}/entities`,
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
      }),
    }),
    deleteEntityListFolder: build.mutation<
      DeleteEntityListFolderApiResponse,
      DeleteEntityListFolderApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/entityListFolders/${queryArg.folderId}`,
        method: 'DELETE',
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
      }),
    }),
    createEntityListItem: build.mutation<
      CreateEntityListItemApiResponse,
      CreateEntityListItemApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/lists/${queryArg.entityListId}/items`,
        method: 'POST',
        body: queryArg.entityListItemPostModel,
      }),
    }),
    updateEntityListItem: build.mutation<
      UpdateEntityListItemApiResponse,
      UpdateEntityListItemApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/lists/${queryArg.entityListId}/items/${queryArg.entityListItemId}`,
        method: 'PATCH',
        body: queryArg.entityListItemPatchModel,
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
        url: `/api/projects/${queryArg.projectName}/lists/${queryArg.entityListId}/items/${queryArg.entityListItemId}`,
        method: 'DELETE',
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
    setEntityListItemsOrder: build.mutation<
      SetEntityListItemsOrderApiResponse,
      SetEntityListItemsOrderApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/lists/${queryArg.entityListId}/order`,
        method: 'POST',
        body: queryArg.orderEntityListItemsRequestModel,
      }),
    }),
    createEntityList: build.mutation<CreateEntityListApiResponse, CreateEntityListApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/lists`,
        method: 'POST',
        body: queryArg.entityListPostModel,
      }),
    }),
    updateEntityList: build.mutation<UpdateEntityListApiResponse, UpdateEntityListApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/lists/${queryArg.entityListId}`,
        method: 'PATCH',
        body: queryArg.entityListPatchModel,
      }),
    }),
    getEntityList: build.query<GetEntityListApiResponse, GetEntityListApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/lists/${queryArg.entityListId}`,
        params: {
          metadata_only: queryArg.metadataOnly,
        },
      }),
    }),
    deleteEntityList: build.mutation<DeleteEntityListApiResponse, DeleteEntityListApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/lists/${queryArg.entityListId}`,
        method: 'DELETE',
      }),
    }),
    duplicateEntityList: build.mutation<DuplicateEntityListApiResponse, DuplicateEntityListApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/lists/${queryArg.entityListId}/duplicate`,
        method: 'POST',
        body: queryArg.payload,
      }),
    }),
    materializeEntityList: build.mutation<
      MaterializeEntityListApiResponse,
      MaterializeEntityListApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/lists/${queryArg.entityListId}/materialize`,
        method: 'POST',
      }),
    }),
  }),
  overrideExisting: false,
})
export { injectedRtkApi as api }
export type GetEntityListAttributesDefinitionApiResponse =
  /** status 200 Successful Response */ EntityListAttributeDefinition[]
export type GetEntityListAttributesDefinitionApiArg = {
  entityListId: string
  projectName: string
}
export type SetEntityListAttributesDefinitionApiResponse = /** status 200 Successful Response */ any
export type SetEntityListAttributesDefinitionApiArg = {
  entityListId: string
  projectName: string
  payload: EntityListAttributeDefinition[]
}
export type GetListEntitiesApiResponse = /** status 200 Successful Response */ EntityListEnities
export type GetListEntitiesApiArg = {
  entityListId: string
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
  entityListFolderPostModel: EntityListFolderPostModel
}
export type UpdateEntityListFolderApiResponse = /** status 200 Successful Response */ any
export type UpdateEntityListFolderApiArg = {
  projectName: string
  folderId: string
  entityListFolderPatchModel: EntityListFolderPatchModel
}
export type DeleteEntityListFolderApiResponse = /** status 200 Successful Response */ any
export type DeleteEntityListFolderApiArg = {
  projectName: string
  folderId: string
}
export type SetEntityListFoldersOrderApiResponse = /** status 200 Successful Response */ any
export type SetEntityListFoldersOrderApiArg = {
  projectName: string
  entityListFolderOrderModel: EntityListFolderOrderModel
}
export type CreateEntityListItemApiResponse = /** status 201 Successful Response */ any
export type CreateEntityListItemApiArg = {
  projectName: string
  entityListId: string
  entityListItemPostModel: EntityListItemPostModel
}
export type UpdateEntityListItemApiResponse = /** status 200 Successful Response */ any
export type UpdateEntityListItemApiArg = {
  projectName: string
  entityListId: string
  entityListItemId: string
  'x-sender'?: string | null
  'x-sender-type'?: string
  entityListItemPatchModel: EntityListItemPatchModel
}
export type DeleteEntityListItemApiResponse = /** status 200 Successful Response */ any
export type DeleteEntityListItemApiArg = {
  projectName: string
  entityListId: string
  entityListItemId: string
  'x-sender'?: string | null
  'x-sender-type'?: string
}
export type UpdateEntityListItemsApiResponse = /** status 200 Successful Response */ any
export type UpdateEntityListItemsApiArg = {
  listId: string
  projectName: string
  'x-sender'?: string | null
  'x-sender-type'?: string
  entityListMultiPatchModel: EntityListMultiPatchModel
}
export type SetEntityListItemsOrderApiResponse = unknown
export type SetEntityListItemsOrderApiArg = {
  projectName: string
  entityListId: string
  orderEntityListItemsRequestModel: OrderEntityListItemsRequestModel
}
export type CreateEntityListApiResponse = /** status 201 Successful Response */ EntityListSummary
export type CreateEntityListApiArg = {
  projectName: string
  entityListPostModel: EntityListPostModel
}
export type UpdateEntityListApiResponse = /** status 200 Successful Response */ any
export type UpdateEntityListApiArg = {
  projectName: string
  entityListId: string
  entityListPatchModel: EntityListPatchModel
}
export type GetEntityListApiResponse = /** status 200 Successful Response */ EntityListModel
export type GetEntityListApiArg = {
  projectName: string
  entityListId: string
  /** When true, only return metadata */
  metadataOnly?: boolean
}
export type DeleteEntityListApiResponse = /** status 200 Successful Response */ any
export type DeleteEntityListApiArg = {
  projectName: string
  entityListId: string
}
export type DuplicateEntityListApiResponse = /** status 201 Successful Response */ EntityListSummary
export type DuplicateEntityListApiArg = {
  projectName: string
  entityListId: string
  payload: EntityListDuplicatePostModel | null
}
export type MaterializeEntityListApiResponse =
  /** status 200 Successful Response */ EntityListSummary
export type MaterializeEntityListApiArg = {
  projectName: string
  entityListId: string
}
export type IconModel = {
  type?: 'material-symbols' | 'url'
  /** The name of the icon (for type material-symbols) */
  name?: string | null
  /** The color of the icon (for type material-symbols) */
  color?: string | null
  /** The URL of the icon (for type url) */
  url?: string | null
}
export type EnumItem = {
  value: string | number | number | boolean
  label: string
  description?: string | null
  fulltext?: string[] | null
  group?: string | null
  /** Icon name (material symbol) or IconModel object */
  icon?: string | IconModel | null
  color?: string | null
  shortName?: string | null
  /** Enum item is visible, but not selectable */
  disabled?: boolean
  /** Message to show when the option is disabled */
  disabledMessage?: string | null
  /** Enum item is not visible in the dropdown */
  hidden?: boolean
  /** Extra badge labels to display next to the item */
  badges?: string[] | null
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
  title?: string | null
  description?: string | null
  /** Example value of the field. */
  example?: any
  /** Default value for the attribute. Do not set for list types. */
  default?: any
  gt?: number | number | null
  ge?: number | number | null
  lt?: number | number | null
  le?: number | number | null
  minLength?: number | null
  maxLength?: number | null
  /** Minimum number of items in list type. */
  minItems?: number | null
  /** Only for list types. Maximum number of items in the list. */
  maxItems?: number | null
  /** Only for string types. The value must match this regex. */
  regex?: string | null
  /** List of enum items used for displaying select widgets */
  enum?: EnumItem[] | null
  /** Name of the function that provides enum values dynamically. */
  enumResolver?: string | null
  /** Settings passed to the enum resolver function. */
  enumResolverSettings?: {
    [key: string]: any
  } | null
  /** Inherit the attribute value from the parent entity. */
  inherit?: boolean
  /** Specific widget style this field should use. */
  widget?: string | null
  /** Any additional config specific for the widget style.(Date formats, precision etc.) */
  widgetSettings?: {
    [key: string]: any
  } | null
}
export type EntityListAttributeDefinition = {
  name: string
  data: AttributeData
}
export type ValidationError = {
  loc: (string | number)[]
  msg: string
  type: string
  input?: any
  ctx?: object
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
  color?: string | null
  /** Icon name */
  icon?: string | null
  /** Folder scope */
  scope?: string[] | null
}
export type EntityListFolderModel = {
  id: string
  label: string
  parentId?: string | null
  position?: number
  owner?: string | null
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
  id?: string | null
  label: string
  parentId?: string | null
  access?: {
    [key: string]: number
  }
  data?: EntityListFolderData
}
export type EntityListFolderPatchModel = {
  label?: string | null
  parentId?: string | null
  access?: {
    [key: string]: number
  } | null
  data?: EntityListFolderData | null
}
export type EntityListFolderOrderModel = {
  order: string[]
}
export type EntityListItemPostModel = {
  id?: string
  /** ID of the entity in the list */
  entityId: string
  /** Position of the item in the list */
  position?: number | null
  /** Label of the item */
  label?: string | null
  /** Overrides of the listed entity attributes */
  attrib?: {
    [key: string]: any
  }
  /** Additional data associated with the item */
  data?: {
    [key: string]: any
  }
  /** Tags associated with the item */
  tags?: string[]
}
export type EntityListItemPatchModel = {
  /** ID of the entity in the list */
  entityId?: string | null
  /** Position of the item in the list */
  position?: number | null
  /** Label of the item */
  label?: string | null
  /** Overrides of the listed entity attributes */
  attrib?: {
    [key: string]: any
  }
  /** Additional data associated with the item */
  data?: {
    [key: string]: any
  }
  /** Tags associated with the item */
  tags?: string[]
}
export type EntityListMultiPatchItemModel = {
  id?: string | null
  /** ID of the entity in the list */
  entityId?: string | null
  /** Position of the item in the list */
  position?: number | null
  /** Label of the item */
  label?: string | null
  /** Overrides of the listed entity attributes */
  attrib?: {
    [key: string]: any
  }
  /** Additional data associated with the item */
  data?: {
    [key: string]: any
  }
  /** Tags associated with the item */
  tags?: string[]
}
export type EntityListMultiPatchModel = {
  items?: EntityListMultiPatchItemModel[]
  /** The mode of the operation. `replace` will replace all items with the provided ones. `merge` will merge the provided items with the existing ones.`delete` will delete items with matching ids from the list. */
  mode?: 'replace' | 'merge' | 'delete'
}
export type OrderEntityListItemsRequestModel = {
  /** The list of item IDs in the new order */
  order: string[]
}
export type EntityListSummary = {
  id?: string
  /** Type of the list */
  entityListType: string
  /** ID of the folder containing the list */
  entityListFolderId?: string | null
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
  entityListFolderId?: string | null
  /** Type of the entity that can be included in the list */
  entityType: 'folder' | 'product' | 'version' | 'representation' | 'task' | 'workfile'
  label: string
  /** Access control for the list. Can be specified for users or teams. */
  access?: {
    [key: string]: ListAccessLevel
  }
  /** List attributes */
  attrib?: {
    [key: string]: any
  }
  /** Additional data associated with the list */
  data?: {
    [key: string]: any
  }
  template?: {
    [key: string]: any
  }
  /** List tags */
  tags?: string[]
  /** Name of the user who created the list */
  owner?: string | null
  /** Whether the list is active or not */
  active?: boolean | null
  items?: EntityListItemPostModel[]
}
export type EntityListPatchModel = {
  label?: string | null
  /** Access control for the list. Can be specified for users or teams. */
  access?: {
    [key: string]: ListAccessLevel
  }
  /** List attributes */
  attrib?: {
    [key: string]: any
  }
  /** ID of the folder containing the list */
  entityListFolderId?: string | null
  /** Additional data associated with the list */
  data?: {
    [key: string]: any
  }
  /** List tags */
  tags?: string[]
  /** Name of the user who created the list */
  owner?: string | null
  /** Whether the list is active or not */
  active?: boolean | null
}
export type EntityListItemModel = {
  id?: string
  /** ID of the entity in the list */
  entityId: string
  /** Position of the item in the list */
  position: number
  /** Label of the item */
  label?: string | null
  /** Overrides of the listed entity attributes */
  attrib?: {
    [key: string]: any
  }
  /** Additional data associated with the item */
  data?: {
    [key: string]: any
  }
  /** Tags associated with the item */
  tags?: string[]
  /** Path to the folder where the item is located */
  folderPath: string
  createdBy?: string | null
  updatedBy?: string | null
  createdAt?: string
  updatedAt?: string
}
export type EntityListModel = {
  id?: string
  /** Type of the list */
  entityListType: string
  /** ID of the folder containing the list */
  entityListFolderId?: string | null
  /** Type of the entity that can be included in the list */
  entityType: 'folder' | 'product' | 'version' | 'representation' | 'task' | 'workfile'
  label: string
  /** Access control for the list. Can be specified for users or teams. */
  access?: {
    [key: string]: ListAccessLevel
  }
  /** List attributes */
  attrib?: {
    [key: string]: any
  }
  /** Additional data associated with the list */
  data?: {
    [key: string]: any
  }
  template?: {
    [key: string]: any
  }
  /** List tags */
  tags?: string[]
  items?: EntityListItemModel[]
  /** Name of the user who created the list */
  owner?: string | null
  createdBy?: string | null
  updatedBy?: string | null
  createdAt?: string
  updatedAt?: string
  /** Whether the list is active or not */
  active: boolean
  accessLevel?: ListAccessLevel
}
export type EntityListDuplicatePostModel = {
  /** When omitted, a new ID is generated */
  id?: string | null
  /** When omitted, a free label is picked, e.g. `My list (copy)`, then `My list (copy 2)` */
  label?: string | null
  /** When omitted, the copy is placed in the folder of the source list. Explicit `null` places it outside of any folder. */
  entityListFolderId?: string | null
}
