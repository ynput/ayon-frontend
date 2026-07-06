import api from '@shared/api'

type CreateStoryboardApiResponse = {
  id: string
}

type CreateStoryboardApiArg = {
  projectName: string
  label: string
}

export const getStoryboardsApi = api.injectEndpoints({
  endpoints: (build) => ({
    createStoryboard: build.mutation<CreateStoryboardApiResponse, CreateStoryboardApiArg>({
      query: ({ projectName, label }) => ({
        url: `/api/addons/storyboards/0.0.1-dev/${projectName}/boards`,
        method: 'POST',
        body: {
          label,
          items: [],
          sections: [],
        },
        validateStatus: (response, result) => response.status === 200 && !result?.errors?.length,
      }),
      invalidatesTags: (_r, _e, { projectName }) => [
        { type: 'entityList', id: projectName },
        { type: 'entityList', id: 'LIST' },
      ]
    }),
  }),
  overrideExisting: true,
})

export const {
  useCreateStoryboardMutation,
} = getStoryboardsApi
