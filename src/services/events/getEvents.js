import { ayonApi } from '../ayon'

const EVENT_FRAGMENT = `
fragment EventFragment on EventNode {
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
`

const EVENTS_QUERY = `
query Events($last: Int, $includeLogs: Boolean) {
    events(last: $last, includeLogs: $includeLogs) {
      edges {
        node {
          ...EventFragment
        }
      }
    }
  }
  ${EVENT_FRAGMENT}
`

const EVENTS_LOGS_QUERY = `
query EventsWithLogs($last: Int, $before: String, $beforeLogs: String) {
  events(last: $last, before: $before, includeLogs: false) {
    edges {
      node {
        ...EventFragment
      }
      cursor
    }
    pageInfo {
      hasPreviousPage
    }
  }
  logs: events(last: $last, before: $beforeLogs, includeLogs: true) {
    edges {
      node {
        ...EventFragment
      }
      cursor
    }
    pageInfo {
      hasPreviousPage
    }
  }
}
${EVENT_FRAGMENT}
`

const transformEvents = (events) =>
  events?.edges?.map((edge) => ({
    id: edge.node.id,
    topic: edge.node.topic,
    user: edge.node.user,
    sender: edge.node.sender,
    dependsOn: edge.node.dependsOn,
    project: edge.node.project,
    description: edge.node.description,
    updatedAt: edge.node.updatedAt,
    status: edge.node.status,
    entityId: edge.node.summary?.entityId,
    cursor: edge.cursor,
  }))

const getEvents = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    getEvents: build.query({
      query: ({ last = 100, includeLogs = true }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: EVENTS_QUERY,
          variables: { last, includeLogs },
        },
      }),
      transformResponse: (response) => transformEvents(response?.data?.events),
    }),
    getEventsWithLogs: build.query({
      query: ({ last = 100, before = '', beforeLogs = '' }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: EVENTS_LOGS_QUERY,
          variables: { last, before, beforeLogs },
        },
      }),
      transformResponse: (response) => ({
        events: transformEvents(response?.data?.events),
        logs: transformEvents(response?.data?.logs),
        hasPreviousPage: response?.data?.events?.pageInfo?.hasPreviousPage,
      }),
    }),
    getEventById: build.query({
      query: ({ id }) => ({
        url: `/api/events/${id}`,
      }),
    }),
  }),
})

export const { useGetEventsQuery, useGetEventsWithLogsQuery, useGetEventByIdQuery } = getEvents
