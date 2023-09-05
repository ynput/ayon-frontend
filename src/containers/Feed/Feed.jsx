import React, { useMemo } from 'react'
import { Section } from '@ynput/ayon-react-components'
import comments from './commentsData'
import FeedItem from '/src/components/Feed/FeedItem'
import { compareAsc } from 'date-fns'

const Feed = ({ tasks = [], activeUsers }) => {
  const entityIds = useMemo(() => tasks.map((task) => task.id), [tasks])
  const events = [...comments].filter((comment) => entityIds.includes(comment.entityId))

  const references = [...comments]
    .filter(
      (comment) =>
        comment.references.some((ref) => entityIds.includes(ref.refId)) &&
        !entityIds.includes(comment.entityId),
    )
    .map((c) => {
      const ref = c.references.find((ref) => entityIds.includes(ref.refId))

      return { reference: ref, ...c }
    })

  events.push(...references)

  // sort events by date
  events.sort((a, b) => compareAsc(new Date(a.createdAt), new Date(b.createdAt)))

  return (
    <Section style={{ padding: 8, overflow: 'hidden' }}>
      <Section
        style={{
          padding: 8,
          gap: 20,
          overflowY: 'auto',
          paddingBottom: 100,
        }}
      >
        {events.map((event) => (
          <FeedItem key={event.id} {...event} users={activeUsers} />
        ))}
      </Section>
    </Section>
  )
}

export default Feed
