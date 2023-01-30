import { ayonApi } from '../ayon'

const EVENTS_QUERY = `
query Events($last: Int, $includeLogs: Boolean) {
    events(last: $last, includeLogs: $includeLogs) {
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
    getEvents: build.query({
      query: ({ last = 100, includeLogs }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: EVENTS_QUERY,
          variables: { last, includeLogs },
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

export const { useGetEventsQuery, useGetEventByIdQuery } = getEvents
