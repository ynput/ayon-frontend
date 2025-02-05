import { RestAPI as api } from '../../services/ayon'
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
    getServerConfigOverrides: build.query<
      GetServerConfigOverridesApiResponse,
      GetServerConfigOverridesApiArg
    >({
      query: () => ({ url: `/api/config/overrides` }),
    }),
    getServerConfigFile: build.query<GetServerConfigFileApiResponse, GetServerConfigFileApiArg>({
      query: (queryArg) => ({ url: `/api/config/files/${queryArg.fileType}` }),
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
  }),
  overrideExisting: false,
})
export { injectedRtkApi as api }
export type GetServerConfigSchemaApiResponse = /** status 200 Successful Response */ object
export type GetServerConfigSchemaApiArg = void
export type GetServerConfigApiResponse = /** status 200 Successful Response */ ServerConfigModel
export type GetServerConfigApiArg = void
export type SetServerConfigApiResponse = /** status 200 Successful Response */ any
export type SetServerConfigApiArg = {
  serverConfigModel: ServerConfigModel
}
export type GetServerConfigOverridesApiResponse = /** status 200 Successful Response */ object
export type GetServerConfigOverridesApiArg = void
export type GetServerConfigFileApiResponse = /** status 200 Successful Response */ any
export type GetServerConfigFileApiArg = {
  fileType: 'login_background' | 'studio_logo'
}
export type UploadServerConfigFileApiResponse = /** status 200 Successful Response */ any
export type UploadServerConfigFileApiArg = {
  /** The type of file to upload. */
  fileType: 'login_background' | 'studio_logo'
  /** The name of the file. */
  'x-file-name': string
  'content-type': string
}
export type ValidationError = {
  loc: (string | number)[]
  msg: string
  type: string
}
export type HttpValidationError = {
  detail?: ValidationError[]
}
export type CustomizationModel = {
  login_background?: string
  studio_logo?: string
  /** The message of the day that is displayed to users on the login pageMarkdown syntax is supported. */
  motd?: string
}
export type ServerConfigModel = {
  /** The name of the studio */
  studio_name?: string
  /** Customization options for the login page */
  customization?: CustomizationModel
}
