import api from '@api'
import PubSub from '@/pubsub'

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
query Events($last: Int, $includeLogs: Boolean, filter: String) {
    events(last: $last, includeLogs: $includeLogs, filter: $filter) {
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
query EventsWithLogs($last: Int, $before: String, $beforeLogs: String, $filter: String) {
  events(last: $last, before: $before, includeLogs: false, filter: $filter) {
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
  logs: events(last: $last, before: $beforeLogs, includeLogs: true,  filter: $filter) {
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

const EVENTS_BY_TOPICS_QUERY = `
query EventsByTopics($topics: [String!]!, $last: Int, $projects: [String!]!) {
  events(topics: $topics, last: $last, projects: $projects) {
    edges {
      node {
        ...EventFragment
      }
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

const patchNewEvents = (type, events, draft) => {
  // loop through events and add to draft if not already exists
  // if already exists, replace it
  for (const message of events) {
    const index = draft[type].findIndex((e) => e.id === message.id)
    let patch = { ...draft }
    if (index === -1) {
      patch[type].unshift(message)
    } else {
      patch[type][index] = message
    }

    Object.assign(draft, patch)
  }
}

const getEvents = api.injectEndpoints({
  endpoints: (build) => ({
    getEvents: build.query({
      query: ({ last = 100, includeLogs = true, filter = '' }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: EVENTS_QUERY,
          variables: { last, includeLogs, filter },
        },
      }),
      transformResponse: (response) => transformEvents(response?.data?.events),
    }),
    getEventsWithLogs: build.query({
      query: ({ last = 100, before = '', beforeLogs = '', filter = '' }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: EVENTS_LOGS_QUERY,
          variables: { last, before, beforeLogs, filter },
        },
      }),
      transformResponse: (response) => ({
        events: transformEvents(response?.data?.events),
        logs: transformEvents(response?.data?.logs),
        hasPreviousPage: response?.data?.events?.pageInfo?.hasPreviousPage,
      }),
      async onCacheEntryAdded(arg, { updateCachedData, cacheDataLoaded, cacheEntryRemoved }) {
        let token
        try {
          // wait for the initial query to resolve before proceeding
          await cacheDataLoaded

          const handlePubSub = (topic, message) => {
            if (topic === 'client.connected' || topic === 'inbox.message') {
              return
            }

            updateCachedData((draft) => {
              console.log('new ws event')
              if (!topic.startsWith('log.')) {
                // patch only non log messages
                patchNewEvents('events', [message], draft)
              }

              // patch all into logs
              patchNewEvents('logs', [message], draft)
            })
          }

          // sub to websocket topic
          token = PubSub.subscribe('*', handlePubSub)
        } catch {
          // no-op in case `cacheEntryRemoved` resolves before `cacheDataLoaded`,
          // in which case `cacheDataLoaded` will throw
        }
        // cacheEntryRemoved will resolve when the cache subscription is no longer active
        await cacheEntryRemoved
        // perform cleanup steps once the `cacheEntryRemoved` promise resolves
        PubSub.unsubscribe(token)
      },
    }),
    getEventById: build.query({
      query: ({ id }) => ({
        url: `/api/events/${id}`,
      }),
    }),
    getEventsByTopic: build.query({
      query: ({ topics, projects, last = 10 }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: EVENTS_BY_TOPICS_QUERY,
          variables: { topics, projects, last },
        },
      }),
      transformResponse: (response) => transformEvents(response?.data?.events),
    }),
  }),
  overrideExisting: true,
})

export const {
  useGetEventsQuery,
  useGetEventsWithLogsQuery,
  useLazyGetEventsWithLogsQuery,
  useGetEventByIdQuery,
  useGetEventsByTopicQuery,
} = getEvents
