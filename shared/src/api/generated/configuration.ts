import { api } from '@shared/api/base'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    getServerConfigSchema: build.query<
      GetServerConfigSchemaApiResponse,
      GetServerConfigSchemaApiArg
    >({
      query: () => ({ url: `/api/config/schema` }),
    }),
    getServerConfig: build.query<GetServerConfigApiResponse, GetServerConfigApiArg>({
      query: () => ({ url: `/api/config` }),
    }),
    setServerConfig: build.mutation<SetServerConfigApiResponse, SetServerConfigApiArg>({
      query: (queryArg) => ({
        url: `/api/config`,
        method: 'POST',
        body: queryArg.serverConfigModel,
      }),
    }),
    updateServerConfig: build.mutation<UpdateServerConfigApiResponse, UpdateServerConfigApiArg>({
      query: (queryArg) => ({ url: `/api/config`, method: 'PATCH', body: queryArg.payload }),
    }),
    getServerConfigOverrides: build.query<
      GetServerConfigOverridesApiResponse,
      GetServerConfigOverridesApiArg
    >({
      query: () => ({ url: `/api/config/overrides` }),
    }),
    getConfigValue: build.query<GetConfigValueApiResponse, GetConfigValueApiArg>({
      query: (queryArg) => ({ url: `/api/config/value/${queryArg.key}` }),
    }),
    uploadServerConfigFile: build.mutation<
      UploadServerConfigFileApiResponse,
      UploadServerConfigFileApiArg
    >({
      query: (queryArg) => ({
        url: `/api/config/files/${queryArg.fileType}`,
        method: 'PUT',
        headers: {
          'x-file-name': queryArg['x-file-name'],
          'content-type': queryArg['content-type'],
        },
      }),
    }),
    getServerConfigFile: build.query<GetServerConfigFileApiResponse, GetServerConfigFileApiArg>({
      query: (queryArg) => ({ url: `/api/config/files/${queryArg.fileType}` }),
    }),
  }),
  overrideExisting: false,
})
export { injectedRtkApi as api }
export type GetServerConfigSchemaApiResponse = /** status 200 Successful Response */ {
  [key: string]: any
}
export type GetServerConfigSchemaApiArg = void
export type GetServerConfigApiResponse = /** status 200 Successful Response */ ServerConfigModel
export type GetServerConfigApiArg = void
export type SetServerConfigApiResponse = /** status 200 Successful Response */ any
export type SetServerConfigApiArg = {
  serverConfigModel: ServerConfigModel
}
export type UpdateServerConfigApiResponse = unknown
export type UpdateServerConfigApiArg = {
  payload: {
    [key: string]: any
  }
}
export type GetServerConfigOverridesApiResponse = /** status 200 Successful Response */ {
  [key: string]: any
}
export type GetServerConfigOverridesApiArg = void
export type GetConfigValueApiResponse = /** status 200 Successful Response */ any
export type GetConfigValueApiArg = {
  /** The key of the configuration value to retrieve */
  key: string
}
export type UploadServerConfigFileApiResponse = /** status 200 Successful Response */ any
export type UploadServerConfigFileApiArg = {
  /** The type of file to upload. */
  fileType: 'login_background' | 'studio_logo'
  /** The name of the file. */
  'x-file-name': string
  'content-type': string
}
export type GetServerConfigFileApiResponse = /** status 200 Successful Response */ any
export type GetServerConfigFileApiArg = {
  fileType: 'login_background' | 'studio_logo'
}
export type CustomizationModel = {
  login_background?: string | null
  studio_logo?: string | null
  /** The message that is displayed to users on the login page. Markdown syntax is supported. */
  motd?: string
  /** A list of flags that will be passed to the frontend. These can be used to enable or disable frontend features. */
  frontend_flags?: string[]
}
export type AuthenticationModel = {
  /** If enabled, password authentication will be hidden from the login page. */
  hide_password_auth?: boolean
}
export type ProjectOptionsModel = {
  /** A regular expression that is used to create project code from the project name. */
  project_code_regex?: string
}
export type ChangelogSettingsModel = {
  /** If enabled, the changelog will be shown to normal users. */
  show_changelog_to_users?: boolean
}
export type CdnSettingsModel = {
  default_cdn_resolver_url?: string
}
export type ServerConfigModel = {
  /** The name of the studio */
  studio_name?: string
  /** Public URL of the server, used in links sent by email. Set automatically when an administrator first opens the web interface. */
  server_url?: string
  /** Customization options for the web interface */
  customization?: CustomizationModel
  /** Settings related to user authentication */
  authentication?: AuthenticationModel
  project_options?: ProjectOptionsModel
  /** Settings for the changelog feature */
  changelog?: ChangelogSettingsModel
  /** Settings for the CDN resolver */
  cdn?: CdnSettingsModel
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
