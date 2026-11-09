import { api } from '@shared/api/base'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    listPreferences: build.query<ListPreferencesApiResponse, ListPreferencesApiArg>({
      query: (queryArg) => ({
        url: `/api/preferences`,
        params: {
          project_name: queryArg.projectName,
          key_prefix: queryArg.keyPrefix,
        },
      }),
    }),
    getPreference: build.query<GetPreferenceApiResponse, GetPreferenceApiArg>({
      query: (queryArg) => ({
        url: `/api/preferences/${queryArg.key}`,
        params: {
          project_name: queryArg.projectName,
        },
      }),
    }),
    setPreference: build.mutation<SetPreferenceApiResponse, SetPreferenceApiArg>({
      query: (queryArg) => ({
        url: `/api/preferences/${queryArg.key}`,
        method: 'PUT',
        body: queryArg.preferenceData,
        params: {
          project_name: queryArg.projectName,
        },
      }),
    }),
    updatePreference: build.mutation<UpdatePreferenceApiResponse, UpdatePreferenceApiArg>({
      query: (queryArg) => ({
        url: `/api/preferences/${queryArg.key}`,
        method: 'PATCH',
        body: queryArg.preferenceData,
        params: {
          project_name: queryArg.projectName,
        },
      }),
    }),
    deletePreference: build.mutation<DeletePreferenceApiResponse, DeletePreferenceApiArg>({
      query: (queryArg) => ({
        url: `/api/preferences/${queryArg.key}`,
        method: 'DELETE',
        params: {
          project_name: queryArg.projectName,
        },
      }),
    }),
  }),
  overrideExisting: false,
})
export { injectedRtkApi as api }
export type ListPreferencesApiResponse = /** status 200 Successful Response */ PreferenceListModel
export type ListPreferencesApiArg = {
  /** Project scope. Global preferences are used if omitted. */
  projectName?: string | null
  keyPrefix?: string | null
}
export type GetPreferenceApiResponse = /** status 200 Successful Response */ PreferenceModel
export type GetPreferenceApiArg = {
  key: string
  /** Project scope. Global preferences are used if omitted. */
  projectName?: string | null
}
export type SetPreferenceApiResponse = unknown
export type SetPreferenceApiArg = {
  key: string
  /** Project scope. Global preferences are used if omitted. */
  projectName?: string | null
  preferenceData: {
    [key: string]: any
  }
}
export type UpdatePreferenceApiResponse = unknown
export type UpdatePreferenceApiArg = {
  key: string
  /** Project scope. Global preferences are used if omitted. */
  projectName?: string | null
  preferenceData: {
    [key: string]: any
  }
}
export type DeletePreferenceApiResponse = unknown
export type DeletePreferenceApiArg = {
  key: string
  /** Project scope. Global preferences are used if omitted. */
  projectName?: string | null
}
export type PreferenceModel = {
  key: string
  /** None for global preferences */
  projectName?: string | null
  data: {
    [key: string]: any
  }
  updatedAt: string
}
export type PreferenceListModel = {
  preferences: PreferenceModel[]
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
