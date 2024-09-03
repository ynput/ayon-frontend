import { RestAPI as api } from '../../services/ayon'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    getFolderList: build.query<GetFolderListApiResponse, GetFolderListApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/folders`,
        params: {
          attrib: queryArg.attrib,
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
  }),
  overrideExisting: false,
})
export { injectedRtkApi as api }
export type GetFolderListApiResponse = /** status 200 Successful Response */ FolderListModel
export type GetFolderListApiArg = {
  projectName: string
  attrib?: boolean
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
  taskNames?: string[]
  status: string
  attrib?: object
  ownAttrib?: string[]
  updatedAt: string
}
export type FolderListModel = {
  detail: string
  folders: FolderListItem[]
}
export type ValidationError = {
  loc: (string | number)[]
  msg: string
  type: string
}
export type HttpValidationError = {
  detail?: ValidationError[]
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
