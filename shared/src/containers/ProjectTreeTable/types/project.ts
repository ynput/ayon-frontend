export type ActivityResponseModel = {
  /** Activity per day normalized to 0-100 */
  activity: number[]
}
export type ProjectTeamsResponseModel = {
  /** Number of active team members */
  teamSizeActive?: number
  /** Total number of team members */
  teamSizeTotal?: number
  /** Number of active users */
  usersWithAccessActive?: number
  /** Total number of users */
  usersWithAccessTotal?: number
  /** Number of users per role */
  roles: {
    [key: string]: number
  }
}
export type Root = {
  name: string
  windows?: string
  linux?: string
  darwin?: string
}
export type WorkTemplate = {
  name: string
  directory: string
  file: string
}
export type PublishTemplate = {
  name: string
  directory: string
  file: string
}
export type HeroTemplate = {
  name: string
  directory: string
  file: string
}
export type DeliveryTemplate = {
  name: string
  directory: string
  file: string
}
export type StagingDirectory = {
  name: string
  directory?: string
}
export type CustomTemplate = {
  name: string
  value?: string
}
export type Templates = {
  version_padding?: number
  version?: string
  frame_padding?: number
  frame?: string
  work?: WorkTemplate[]
  publish?: PublishTemplate[]
  hero?: HeroTemplate[]
  delivery?: DeliveryTemplate[]
  staging?: StagingDirectory[]
  others?: CustomTemplate[]
}
export type ProjectAttribModel = {
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
  applications?: string[]
  tools?: string[]
}
export type FolderType = {
  name: string
  original_name?: string
  shortName?: string
  icon?: string
}
export type TaskType = {
  name: string
  original_name?: string
  shortName?: string
  color?: string
  icon?: string
}

export type LinkType = {
  link_type: string
  input_type: 'folder' | 'product' | 'version' | 'representation' | 'task' | 'workfile'
  output_type: 'folder' | 'product' | 'version' | 'representation' | 'task' | 'workfile'
  color?: string
  style?: 'solid' | 'dashed'
}
export type Status = {
  name: string
  original_name?: string
  shortName?: string
  state?: 'not_started' | 'in_progress' | 'done' | 'blocked'
  icon?: string
  color?: string
  /** Limit the status to specific entity types. */
  scope?: string[]
}
export type Tag = {
  name: string
  original_name?: string
  color?: string
}
export type Anatomy = {
  /** Setup root paths for the project */
  roots?: Root[]
  /** Path templates configuration */
  templates?: Templates
  /** Attributes configuration */
  attributes?: ProjectAttribModel
  /** Folder types configuration */
  folder_types?: FolderType[]
  /** Task types configuration */
  task_types?: TaskType[]
  /** Link types configuration */
  link_types?: LinkType[]
  /** Statuses configuration */
  statuses?: Status[]
  /** Tags configuration */
  tags?: Tag[]
}
export type ListProjectsItemModel = {
  name: string
  code: string
  active: boolean
  createdAt: string
  updatedAt: string
}
export type ListProjectsResponseModel = {
  detail?: string
  /** Total count of projects (regardless the pagination) */
  count?: number
  /** List of projects */
  projects?: ListProjectsItemModel[]
}
export type LinkTypeModel = {
  /** Name of the link type */
  name: string
  /** Type of the link */
  linkType: string
  /** Input entity type */
  inputType: string
  /** Output entity type */
  outputType: string
  /** Additional link type data */
  data?: Record<string, any>
}
export type ProjectAttribModel2 = {
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
  applications?: string[]
  tools?: string[]
}
export type ProjectModel = {
  /** Name is an unique id of the {entity_name} */
  name: string
  code: string
  library?: boolean
  folderTypes?: FolderType[]
  taskTypes?: TaskType[]
  linkTypes?: LinkTypeModel[]
  statuses?: Status[]
  tags?: Tag[]
  config?: object
  attrib?: ProjectAttribModel2
  data?: Record<string, any>
  /** Whether the project is active */
  active?: boolean
  ownAttrib?: string[]
  /** Time of creation */
  createdAt?: string
  /** Time of last update */
  updatedAt?: string
}
export type UriResponseItem = {
  id: string
  uri: string
}
export type GetUrisResponse = {
  uris?: UriResponseItem[]
}
export type GetUrisRequest = {
  entityType: 'folder' | 'product' | 'version' | 'representation' | 'task' | 'workfile'
  ids?: string[]
}
