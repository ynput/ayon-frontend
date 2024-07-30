import api from '@api'
import { FolderListModel, GetFolderListApiArg } from '@api/rest'

const enhancedApi = api.enhanceEndpoints({
  endpoints: {
    getFolderHierarchy: {
      providesTags: ['hierarchy'],
    },
    getFolderList: {
      providesTags: ['hierarchy'],
    },
  },
})

type GetProjectsFolderListsApiArg = { projects: GetFolderListApiArg[] }

type GetProjectsFolderListsApiResponse = (FolderListModel & { projectName: string })[]

const injectedApi = enhancedApi.injectEndpoints({
  endpoints: (build) => ({
    getProjectsFolderLists: build.query<
      GetProjectsFolderListsApiResponse,
      GetProjectsFolderListsApiArg
    >({
      async queryFn({ projects = [] }, { dispatch }) {
        try {
          const projectFolderLists = await Promise.all(
            projects.map(async (project) => {
              const result = await dispatch(
                enhancedApi.endpoints.getFolderList.initiate(project, { forceRefetch: false }),
              )

              if (result.error || !result.data)
                return { projectName: project.projectName, error: result.error }

              return {
                projectName: project.projectName,
                ...result.data,
              }
            }),
          )

          if (projectFolderLists.some((project) => project.error)) {
            throw new Error('Some projects failed to fetch')
          }

          return { data: projectFolderLists as GetProjectsFolderListsApiResponse }
        } catch (error: any) {
          // handle errors appropriately
          console.error(error)
          throw error
        }
      },
      providesTags: ['hierarchy'],
    }),
  }),
})

export const { useGetFolderHierarchyQuery, useGetProjectsFolderListsQuery } = injectedApi
