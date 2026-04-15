import api from '@shared/api'

export const getStoryboardsApi = api.injectEndpoints({
  endpoints: (build) => ({
    createStoryboard: build.mutation({
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
