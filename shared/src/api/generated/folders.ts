import { api } from '@shared/api/base'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    getFolder: build.query<GetFolderApiResponse, GetFolderApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/folders/${queryArg.folderId}`,
      }),
    }),
    deleteFolder: build.mutation<DeleteFolderApiResponse, DeleteFolderApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/folders/${queryArg.folderId}`,
        method: 'DELETE',
        headers: {
          'x-sender': queryArg['x-sender'],
          'x-sender-type': queryArg['x-sender-type'],
        },
        params: {
          force: queryArg.force,
        },
      }),
    }),
    updateFolder: build.mutation<UpdateFolderApiResponse, UpdateFolderApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/folders/${queryArg.folderId}`,
        method: 'PATCH',
        body: queryArg.folderPatchModel,
        headers: {
          'x-sender': queryArg['x-sender'],
          'x-sender-type': queryArg['x-sender-type'],
        },
      }),
    }),
    getFolderList: build.query<GetFolderListApiResponse, GetFolderListApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/folders`,
        params: {
          attrib: queryArg.attrib,
        },
      }),
    }),
    createFolder: build.mutation<CreateFolderApiResponse, CreateFolderApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/folders`,
        method: 'POST',
        body: queryArg.folderPostModel,
        headers: {
          'x-sender': queryArg['x-sender'],
          'x-sender-type': queryArg['x-sender-type'],
        },
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
    getFolderThumbnail: build.query<GetFolderThumbnailApiResponse, GetFolderThumbnailApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/folders/${queryArg.folderId}/thumbnail`,
        params: {
          placeholder: queryArg.placeholder,
          original: queryArg.original,
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
  }),
  overrideExisting: false,
})
export { injectedRtkApi as api }
export type GetFolderApiResponse = /** status 200 Successful Response */ FolderModel
export type GetFolderApiArg = {
  projectName: string
  folderId: string
}
export type DeleteFolderApiResponse = unknown
export type DeleteFolderApiArg = {
  projectName: string
  folderId: string
  /** Allow recursive deletion */
  force?: boolean
  'x-sender'?: string
  'x-sender-type'?: string
}
export type UpdateFolderApiResponse = unknown
export type UpdateFolderApiArg = {
  projectName: string
  folderId: string
  'x-sender'?: string
  'x-sender-type'?: string
  folderPatchModel: FolderPatchModel
}
export type GetFolderListApiResponse = /** status 200 Successful Response */ FolderListModel
export type GetFolderListApiArg = {
  projectName: string
  /** Include folder attributes */
  attrib?: boolean
}
export type CreateFolderApiResponse = /** status 201 Successful Response */ EntityIdResponse
export type CreateFolderApiArg = {
  projectName: string
  'x-sender'?: string
  'x-sender-type'?: string
  folderPostModel: FolderPostModel
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
export type GetFolderThumbnailApiResponse = /** status 200 Successful Response */ any
export type GetFolderThumbnailApiArg = {
  projectName: string
  folderId: string
  placeholder?: 'empty' | 'none'
  original?: boolean
}
export type CreateFolderThumbnailApiResponse =
  /** status 201 Successful Response */ CreateThumbnailResponseModel
export type CreateFolderThumbnailApiArg = {
  projectName: string
  folderId: string
  'content-type'?: string
}
export type FolderAttribModel = {
  priority?: 'urgent' | 'high' | 'normal' | 'low'
  /** Frame rate */
  fps?: number
  /** Horizontal resolution */
  resolutionWidth?: number
  /** Vertical resolution */
  resolutionHeight?: number
  pixelAspect?: number
  clipIn?: number
  clipOut?: number
  frameStart?: number
  frameEnd?: number
  handleStart?: number
  handleEnd?: number
  /** Date and time when the project or task or asset was started */
  startDate?: string
  /** Deadline date and time */
  endDate?: string
  /** Textual description of the entity */
  description?: string
}
export type FolderModel = {
  /** Unique identifier of the {entity_name} */
  id?: string
  name: string
  label?: string
  folderType?: string
  /** Parent folder ID in the hierarchy */
  parentId?: string
  thumbnailId?: string
  path?: string
  attrib?: FolderAttribModel
  data?: Record<string, any>
  /** Whether the folder is active */
  active?: boolean
  ownAttrib?: string[]
  /** Status of the folder */
  status?: string
  /** Tags assigned to the the folder */
  tags?: string[]
  /** Time of creation */
  createdAt?: string
  /** Time of last update */
  updatedAt?: string
}
export type ValidationError = {
  loc: (string | number)[]
  msg: string
  type: string
}
export type HttpValidationError = {
  detail?: ValidationError[]
}
export type FolderPatchModel = {
  name?: string
  label?: string
  folderType?: string
  /** Parent folder ID in the hierarchy */
  parentId?: string
  thumbnailId?: string
  /** Status of the folder */
  status?: string
  /** Tags assigned to the the folder */
  tags?: string[]
  attrib?: FolderAttribModel
  data?: Record<string, any>
  /** Whether the folder is active */
  active?: boolean
}
export type FolderListItem = {
  id: string
  path: string
  parentId?: string
  parents: string[]
  name: string
  label?: string
  folderType: string
  hasTasks?: boolean
  hasChildren?: boolean
  hasReviewables?: boolean
  taskNames?: string[]
  tags?: string[]
  status: string
  attrib?: object
  ownAttrib?: string[]
  updatedAt: string
  createdAt: string
  hasVersions?: boolean
}
export type FolderListModel = {
  detail: string
  folders: FolderListItem[]
}
export type EntityIdResponse = {
  /** Entity ID */
  id: string
}
export type FolderPostModel = {
  /** Explicitly set the ID of the entity */
  id?: string
  name: string
  label?: string
  folderType?: string
  /** Parent folder ID in the hierarchy */
  parentId?: string
  thumbnailId?: string
  /** Status of the folder */
  status?: string
  /** Tags assigned to the the folder */
  tags?: string[]
  attrib?: FolderAttribModel
  data?: Record<string, any>
  /** Whether the folder is active */
  active?: boolean
}
export type HierarchyFolderModel = {
  /** Folder ID */
  id: string
  name: string
  label: string
  status: string
  folderType?: string
  hasTasks: boolean
  taskNames: string[]
  parents: string[]
  parentId?: string
  children?: HierarchyFolderModel[]
}
export type HierarchyResponseModel = {
  detail: string
  projectName: string
  hierarchy: HierarchyFolderModel[]
}
export type CreateThumbnailResponseModel = {
  id: string
}
