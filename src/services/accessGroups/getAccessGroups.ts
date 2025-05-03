import { api } from '@api/rest/accessGroups'
import { projectApi } from '@shared/api'
import { $Any } from '@types'

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

const accessGroupsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getProjectsAccess: build.query<GetProjectsUsersApiResponse, GetProjectsUsersParams>({
      async queryFn({ projects = [] }, { dispatch, forced }) {
        try {
          let promises = []
          let projectUsersData: $Any = {}
          for (const project of projects) {
            promises.push(
              dispatch(
                projectApi.endpoints.getProjectUsers.initiate(
                  { projectName: project },
                  { forceRefetch: forced },
                ),
              ).then((response: $Any) => {
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
        } catch (error: $Any) {
          console.error(error)
          return { error, meta: undefined, data: undefined }
        }
      },
      providesTags: (_res, _error, { projects }) =>
        projects.map((projectName) => ({ type: 'projectAccess', id: projectName })),
    }),
  }),
  overrideExisting: true,
})

accessGroupsApi.enhanceEndpoints({
  endpoints: {
    getAccessGroups: {
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
    getAccessGroupSchema: {},
  },
})

export const {
  useGetAccessGroupsQuery,
  useGetAccessGroupQuery,
  useGetAccessGroupSchemaQuery,
  useGetProjectsAccessQuery,
} = accessGroupsApi

export default accessGroupsApi
