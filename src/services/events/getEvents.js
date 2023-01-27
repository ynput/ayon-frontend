import { ayonApi } from '../ayon'

const ALL_EVENTS_QUERY = `
query Events($last: Int) {
    events(last: $last) {
      edges {
        node {
          id
          topic
          user
          sender
          project
          description
          dependsOn
          updatedAt
          status
        }
      }
    }
}
`

const getEvents = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    getAllEvents: build.query({
      query: ({ last = 100 }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: ALL_EVENTS_QUERY,
          variables: { last },
        },
      }),
      transformResponse: (response) =>
        response.data.events.edges.map((edge) => ({
          id: edge.node.id,
          topic: edge.node.topic,
          user: edge.node.user,
          sender: edge.node.sender,
          dependsOn: edge.node.dependsOn,
          project: edge.node.project,
          description: edge.node.description,
          updatedAt: edge.node.updatedAt,
          status: edge.node.status,
        })),
    }),
    getEventById: build.query({
      query: ({ id }) => ({
        url: `/api/events/${id}`,
      }),
    }),
  }),
})

export const { useGetAllEventsQuery, useGetEventByIdQuery } = getEvents
