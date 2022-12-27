// Need to use the React-specific entry point to allow generating React hooks
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import short from 'short-uuid'

const buildTagsQuery = (type) =>
  `
      query Tags($projectName: String!, $ids: [String!]!) {
          project(name: $projectName) {
            ${type}s(ids: $ids) {
                  edges {
                      node {
                          id
                          name
                          tags
                      }
                  }
              }
          }
      }
  
  `

const buildTaskDetailsQuery = (attributes) => {
  let f_attribs = ''
  for (const attrib of attributes) {
    if (attrib.scope.includes('task')) f_attribs += `${attrib.name}\n`
  }

  const TASK_QUERY = `
    query Tasks($projectName: String!, $tasks: [String!]!) {
        project(name: $projectName) {
            tasks(ids: $tasks) {
                edges {
                    node {
                        name
                        status
                        tags
                        taskType
                        assignees
                        attrib {
                          #TASK_ATTRS#
                        }
                    }
                }
            }
        }
    }

`
  return TASK_QUERY.replace('#TASK_ATTRS#', f_attribs)
}

// Define a service using a base URL and expected endpoints
export const ayonApi = createApi({
  reducerPath: 'ayonApi',
  baseQuery: fetchBaseQuery({
    prepareHeaders: (headers) => {
      const storedAccessToken = localStorage.getItem('accessToken')
      if (storedAccessToken) {
        // headers.common['Authorization'] = `Bearer ${storedAccessToken}`
        headers.set('Authorization', `Bearer ${storedAccessToken}`)
      }
      //   headers.common['X-Sender'] = short.generate()
      headers.set('X-Sender', short.generate())

      return headers
    },
  }),
  endpoints: (builder) => ({
    getTagsByType: builder.query({
      query: ({ type, projectName, ids }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: buildTagsQuery(type),
          variables: { projectName, ids },
        },
      }),
      transformResponse: (response, meta, { type }) =>
        response.data.project[type + 's'].edges.reduce(
          (acc, cur) => ({ ...acc, [cur.node.id]: cur.node }),
          {},
        ),
    }),
    updateTagsByType: builder.mutation({
      query: ({ projectName, operations }) => ({
        url: `/api/projects/${projectName}/operations`,
        method: 'POST',
        body: { operations },
      }),
    }),
    getTaskDetails: builder.query({
      query: ({ projectName, tasks, attributes }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: buildTaskDetailsQuery(attributes),
          variables: { projectName, tasks },
        },
      }),
      transformResponse: (response) => response.data.project.tasks.edges[0].node,
    }),
  }),
})

// Export hooks for usage in function components, which are
// auto-generated based on the defined endpoints
export const { useGetTagsByTypeQuery, useUpdateTagsByTypeMutation, useGetTaskDetailsQuery } =
  ayonApi
