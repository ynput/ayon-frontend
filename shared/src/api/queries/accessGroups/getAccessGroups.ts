import { projectsApi, accessApi } from '@shared/api/generated'
import { normalizeQueryError } from '@shared/api/base/queryError'

export type ProjectUserData = {
  [project: string]: {
    [user: string]: string[]
  }
}

export type GetProjectsUsersApiResponse = {
  data: ProjectUserData
}

type GetProjectsUsersParams = {
  projects: string[]
}

const enhancedApi = accessApi.injectEndpoints({
  endpoints: (build) => ({
    getProjectsAccess: build.query<GetProjectsUsersApiResponse, GetProjectsUsersParams>({
      async queryFn({ projects = [] }, { dispatch, forced }) {
        try {
          let promises = []
          let projectUsersData: any = {}
          for (const project of projects) {
            promises.push(
              dispatch(
                projectsApi.endpoints.getProjectUsers.initiate(
                  { projectName: project },
                  { forceRefetch: forced },
                ),
              ).then((response: any) => {
                if (response.status === 'rejected') {
                  return
                }
                projectUsersData = {
                  ...projectUsersData,
                  [project]: response.data,
                }
              }),
            )
          }

          await Promise.all(promises)
          return { data: projectUsersData, meta: undefined, error: undefined }
        } catch (error: any) {
          console.error(error)
          return { error: normalizeQueryError(error) }
        }
      },
      providesTags: (_res, _error, { projects }) =>
        projects.map((projectName) => ({ type: 'projectAccess', id: projectName })),
    }),
  }),
  overrideExisting: true,
})

enhancedApi.enhanceEndpoints({
  endpoints: {
    getStudioAccessGroups: {
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ name }) => ({ type: 'accessGroup', id: name })),
              { type: 'accessGroup', id: 'LIST' },
            ]
          : [{ type: 'accessGroup', id: 'LIST' }],
    },
    getAccessGroup: {
      providesTags: (_result, _err, { accessGroupName }) => [
        { type: 'accessGroup', id: accessGroupName },
        { type: 'accessGroup', id: 'LIST' },
      ],
    },
    getAccessGroups: {
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ name }) => ({ type: 'accessGroup', id: name })),
              { type: 'accessGroup', id: 'LIST' },
            ]
          : [{ type: 'accessGroup', id: 'LIST' }],
    },
    getAccessGroupSchema: {},
  },
})

export const {
  useGetStudioAccessGroupsQuery,
  useGetAccessGroupsQuery,
  useGetAccessGroupQuery,
  useGetAccessGroupSchemaQuery,
  useGetProjectsAccessQuery,
} = enhancedApi

export default enhancedApi
