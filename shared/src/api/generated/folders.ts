import { api } from '@shared/api/base'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    getFolder: build.query<GetFolderApiResponse, GetFolderApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/folders/${queryArg.folderId}`,
      }),
    }),
    updateFolder: build.mutation<UpdateFolderApiResponse, UpdateFolderApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/folders/${queryArg.folderId}`,
        method: 'PATCH',
        body: queryArg.folderPatchModel,
      }),
    }),
    deleteFolder: build.mutation<DeleteFolderApiResponse, DeleteFolderApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/folders/${queryArg.folderId}`,
        method: 'DELETE',
        params: {
          force: queryArg.force,
        },
      }),
    }),
    createFolder: build.mutation<CreateFolderApiResponse, CreateFolderApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/folders`,
        method: 'POST',
        body: queryArg.folderPostModel,
      }),
    }),
    getFolderList: build.query<GetFolderListApiResponse, GetFolderListApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/folders`,
        params: {
          attrib: queryArg.attrib,
          visibility: queryArg.visibility,
        },
      }),
    }),
    searchFolders: build.mutation<SearchFoldersApiResponse, SearchFoldersApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/folders/search`,
        method: 'POST',
        body: queryArg.folderSearchRequest,
      }),
    }),
    getFolderHierarchy: build.query<GetFolderHierarchyApiResponse, GetFolderHierarchyApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/hierarchy`,
        params: {
          search: queryArg.search,
          types: queryArg.types,
        },
      }),
    }),
    createFolderThumbnail: build.mutation<
      CreateFolderThumbnailApiResponse,
      CreateFolderThumbnailApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/folders/${queryArg.folderId}/thumbnail`,
        method: 'POST',
        headers: {
          'content-type': queryArg['content-type'],
        },
      }),
    }),
    getFolderThumbnail: build.query<GetFolderThumbnailApiResponse, GetFolderThumbnailApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/folders/${queryArg.folderId}/thumbnail`,
        params: {
          placeholder: queryArg.placeholder,
          original: queryArg.original,
        },
      }),
    }),
    getFolderFilmstrip: build.query<GetFolderFilmstripApiResponse, GetFolderFilmstripApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/folders/${queryArg.folderId}/filmstrip`,
        params: {
          placeholder: queryArg.placeholder,
        },
      }),
    }),
  }),
  overrideExisting: false,
})
export { injectedRtkApi as api }
export type GetFolderApiResponse = /** status 200 Successful Response */ FolderModel
export type GetFolderApiArg = {
  projectName: string
  folderId: string
}
export type UpdateFolderApiResponse = unknown
export type UpdateFolderApiArg = {
  projectName: string
  folderId: string
  folderPatchModel: FolderPatchModel
}
export type DeleteFolderApiResponse = unknown
export type DeleteFolderApiArg = {
  projectName: string
  folderId: string
  /** Allow recursive deletion */
  force?: boolean
}
export type CreateFolderApiResponse = /** status 201 Successful Response */ EntityIdResponse
export type CreateFolderApiArg = {
  projectName: string
  folderPostModel: FolderPostModel
}
export type GetFolderListApiResponse = /** status 200 Successful Response */ FolderListModel
export type GetFolderListApiArg = {
  projectName: string
  /** Include folder attributes */
  attrib?: boolean
  /** Filter folders by visibility, including ancestor folders. 'visible' returns only visible folders; 'hidden' returns folders that are inactive themselves or have an inactive ancestor. 'all' (default) returns both. */
  visibility?: 'all' | 'visible' | 'hidden'
}
export type SearchFoldersApiResponse = /** status 200 Successful Response */ FolderSearchResponse
export type SearchFoldersApiArg = {
  projectName: string
  folderSearchRequest: FolderSearchRequest
}
export type GetFolderHierarchyApiResponse =
  /** status 200 Successful Response */ HierarchyResponseModel
export type GetFolderHierarchyApiArg = {
  projectName: string
  /** Full-text search query used to limit the result */
  search?: string
  /** Comma separated list of folder_types to show */
  types?: string
}
export type CreateFolderThumbnailApiResponse =
  /** status 200 Successful Response */ CreateThumbnailResponseModel
export type CreateFolderThumbnailApiArg = {
  projectName: string
  folderId: string
  'content-type'?: string | null
}
export type GetFolderThumbnailApiResponse = /** status 200 Successful Response */ any
export type GetFolderThumbnailApiArg = {
  projectName: string
  folderId: string
  placeholder?: 'empty' | 'none'
  original?: boolean
}
export type GetFolderFilmstripApiResponse = /** status 200 Successful Response */ FilmstripModel
export type GetFolderFilmstripApiArg = {
  projectName: string
  folderId: string
  placeholder?: 'empty' | 'none'
}
export type FolderModel = {
  /** Unique identifier of the entity */
  id?: string
  name: string
  label?: string | null
  folderType?: string | null
  /** Parent folder ID in the hierarchy */
  parentId?: string | null
  thumbnailId?: string | null
  /** Resolved folder path in the project hierarchy */
  path?: string | null
  hasVersions?: boolean | null
  /** Attribute values of the entity */
  attrib?: {
    [key: string]: any
  }
  data?: {
    [key: string]: any
  }
  /** Whether the entity is active */
  active?: boolean
  /** List of attributes explicitly set on the entity itself (not inherited) */
  ownAttrib?: string[]
  /** Status of the entity */
  status?: string | null
  /** Tags assigned to the entity */
  tags?: string[]
  /** Who created the entity */
  createdBy?: string | null
  /** Who last updated the entity */
  updatedBy?: string | null
  /** Time of creation */
  createdAt?: string
  /** Time of last update */
  updatedAt?: string
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
export type FolderPatchModel = {
  name?: string | null
  label?: string | null
  folderType?: string | null
  /** Parent folder ID in the hierarchy */
  parentId?: string | null
  thumbnailId?: string | null
  /** Status of the entity */
  status?: string | null
  /** Tags assigned to the entity */
  tags?: string[] | null
  /** Who created the entity */
  createdBy?: string | null
  /** Who last updated the entity */
  updatedBy?: string | null
  /** Attribute values of the entity */
  attrib?: {
    [key: string]: any
  }
  data?: {
    [key: string]: any
  } | null
  /** Whether the entity is active */
  active?: boolean | null
}
export type EntityIdResponse = {
  /** Entity ID */
  id: string
}
export type FolderPostModel = {
  /** Unique identifier of the entity */
  id?: string
  name: string
  label?: string | null
  folderType?: string | null
  /** Parent folder ID in the hierarchy */
  parentId?: string | null
  thumbnailId?: string | null
  /** Status of the entity */
  status?: string | null
  /** Tags assigned to the entity */
  tags?: string[]
  /** Who created the entity */
  createdBy?: string | null
  /** Who last updated the entity */
  updatedBy?: string | null
  /** Attribute values of the entity */
  attrib?: {
    [key: string]: any
  }
  data?: {
    [key: string]: any
  }
  /** Whether the entity is active */
  active?: boolean
}
export type FolderListItem = {
  id: string
  path: string
  parentId?: string | null
  parents: string[]
  name: string
  label?: string | null
  folderType: string
  hasTasks?: boolean
  hasChildren?: boolean
  hasReviewables?: boolean
  thumbnailHash: string
  taskNames?: string[] | null
  tags?: string[] | null
  status: string
  attrib?: {
    [key: string]: any
  } | null
  active?: boolean
  visible?: boolean
  ownAttrib?: string[] | null
  createdAt: string
  updatedAt: string
  createdBy?: string | null
  updatedBy?: string | null
}
export type FolderListModel = {
  detail: string
  folders: FolderListItem[]
}
export type FolderSearchResponse = {
  /** List of folder ids containing tasks matching the query */
  folderIds?: string[]
}
export type QueryCondition = {
  /** Path to the key separated by slashes */
  key: string
  /** Value to compare against */
  value?: string | number | number | boolean | string[] | number[] | number[] | null
  /** Comparison operator. like and notlike perform case-insensitive substring matching. One surrounding pair of % is treated as a substring wrapper; %, _ and backslashes within it are literal. */
  operator?:
    | 'eq'
    | 'like'
    | 'notlike'
    | 're'
    | 'lt'
    | 'gt'
    | 'lte'
    | 'gte'
    | 'ne'
    | 'isnull'
    | 'notnull'
    | 'in'
    | 'notin'
    | 'includes'
    | 'excludes'
    | 'includesall'
    | 'excludesall'
    | 'includesany'
    | 'excludesany'
}
export type QueryFilter = {
  /** List of conditions to be evaluated */
  conditions?: (QueryCondition | QueryFilter)[]
  /** Operator to use when joining conditions */
  operator?: 'and' | 'or'
}
export type FolderSearchRequest = {
  /** Filter object used to resolve the tasks */
  taskFilter?: QueryFilter | null
  /** 'fulltext' search used to resolve the tasks */
  taskSearch?: string | null
  /** Filter object used to resolve the folders */
  folderFilter?: QueryFilter | null
  /** 'fulltext' search used to resolve the folders */
  folderSearch?: string | null
  /** Unified 'fulltext' search applied to both tasks and folders */
  search?: string | null
}
export type HierarchyFolderModel = {
  /** Folder ID */
  id: string
  name: string
  label: string
  status: string
  folderType?: string | null
  hasTasks: boolean
  taskNames: string[]
  parents: string[]
  parentId?: string | null
  children?: HierarchyFolderModel[]
}
export type HierarchyResponseModel = {
  detail: string
  projectName: string
  hierarchy: HierarchyFolderModel[]
}
export type AffectedEntity = {
  entityType: string
  entityId: string
  thumbnailHash: string
  thumbnailId?: string | null
}
export type CreateThumbnailResponseModel = {
  id: string
  affectedEntities?: AffectedEntity[] | null
}
export type FilmstripModel = {
  fileId: string
  url: string
  frames: number
  columns: number
  frameWidth: number
  frameHeight: number
}
