import { api } from '@shared/api/base'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    getAnatomySchema: build.query<GetAnatomySchemaApiResponse, GetAnatomySchemaApiArg>({
      query: () => ({ url: `/api/anatomy/schema` }),
    }),
    getAnatomyPresets: build.query<GetAnatomyPresetsApiResponse, GetAnatomyPresetsApiArg>({
      query: () => ({ url: `/api/anatomy/presets` }),
    }),
    getAnatomyPreset: build.query<GetAnatomyPresetApiResponse, GetAnatomyPresetApiArg>({
      query: (queryArg) => ({ url: `/api/anatomy/presets/${queryArg.presetName}` }),
    }),
    updateAnatomyPreset: build.mutation<UpdateAnatomyPresetApiResponse, UpdateAnatomyPresetApiArg>({
      query: (queryArg) => ({
        url: `/api/anatomy/presets/${queryArg.presetName}`,
        method: 'PUT',
        body: queryArg.anatomy,
      }),
    }),
    deleteAnatomyPreset: build.mutation<DeleteAnatomyPresetApiResponse, DeleteAnatomyPresetApiArg>({
      query: (queryArg) => ({
        url: `/api/anatomy/presets/${queryArg.presetName}`,
        method: 'DELETE',
      }),
    }),
    setPrimaryPreset: build.mutation<SetPrimaryPresetApiResponse, SetPrimaryPresetApiArg>({
      query: (queryArg) => ({
        url: `/api/anatomy/presets/${queryArg.presetName}/primary`,
        method: 'POST',
      }),
    }),
    unsetPrimaryPreset: build.mutation<UnsetPrimaryPresetApiResponse, UnsetPrimaryPresetApiArg>({
      query: (queryArg) => ({
        url: `/api/anatomy/presets/${queryArg.presetName}/primary`,
        method: 'DELETE',
      }),
    }),
    renameAnatomyPreset: build.mutation<RenameAnatomyPresetApiResponse, RenameAnatomyPresetApiArg>({
      query: (queryArg) => ({
        url: `/api/anatomy/presets/${queryArg.presetName}/rename`,
        method: 'POST',
        body: queryArg.renamePresetModel,
      }),
    }),
  }),
  overrideExisting: false,
})
export { injectedRtkApi as api }
export type GetAnatomySchemaApiResponse = /** status 200 Successful Response */ object
export type GetAnatomySchemaApiArg = void
export type GetAnatomyPresetsApiResponse =
  /** status 200 Successful Response */ AnatomyPresetListModel
export type GetAnatomyPresetsApiArg = void
export type GetAnatomyPresetApiResponse = /** status 200 Successful Response */ Anatomy
export type GetAnatomyPresetApiArg = {
  presetName: string
}
export type UpdateAnatomyPresetApiResponse = unknown
export type UpdateAnatomyPresetApiArg = {
  presetName: string
  anatomy: Anatomy
}
export type DeleteAnatomyPresetApiResponse = unknown
export type DeleteAnatomyPresetApiArg = {
  presetName: string
}
export type SetPrimaryPresetApiResponse = unknown
export type SetPrimaryPresetApiArg = {
  presetName: string
}
export type UnsetPrimaryPresetApiResponse = unknown
export type UnsetPrimaryPresetApiArg = {
  presetName: string
}
export type RenameAnatomyPresetApiResponse = unknown
export type RenameAnatomyPresetApiArg = {
  presetName: string
  renamePresetModel: RenamePresetModel
}
export type AnatomyPresetListItem = {
  name: string
  primary: boolean
  version: string
}
export type AnatomyPresetListModel = {
  /** Anatomy model version currently used in Ayon */
  version: string
  presets?: AnatomyPresetListItem[]
}
export type EntityNaming = {
  /** How to capitalize the entity names */
  capitalization?: 'lower' | 'upper' | 'keep' | 'pascal' | 'camel'
  /** Character to separate different parts of the name */
  separator?: '' | '_' | '-' | '.'
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
}
export type FolderType = {
  name: string
  original_name?: string
  shortName?: string
  color?: string
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
export type DefaultProductBaseType = {
  color?: string
  icon?: string
}
export type ProductBaseType = {
  name?: string
  color?: string
  icon?: string
}
export type ProductBaseTypes = {
  /** Default appearance for product types */
  default?: DefaultProductBaseType
  definitions?: ProductBaseType[]
}
export type Anatomy = {
  /** Settings for automatic entity name generation */
  entity_naming?: EntityNaming
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
  product_base_types?: ProductBaseTypes
}
export type ValidationError = {
  loc: (string | number)[]
  msg: string
  type: string
}
export type HttpValidationError = {
  detail?: ValidationError[]
}
export type RenamePresetModel = {
  /** The new name of the anatomy preset. */
  name: string
}
