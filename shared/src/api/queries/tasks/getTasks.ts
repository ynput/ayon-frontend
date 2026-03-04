import { api } from '@shared/api/generated/tasks'

const enhancedApi = api.enhanceEndpoints({
  endpoints: {
    getTask: {
      providesTags: (_result, _error, { taskId }) => [
        { type: 'task', id: taskId },
      ],
    },
  },
})

export const { useGetTaskQuery } = enhancedApi