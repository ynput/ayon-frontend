import React from 'react'
import { useGetEventByIdQuery } from '/src/services/events/getEvents'
import { Section, Panel } from '@ynput/ayon-react-components'
import DetailHeader from '/src/components/DetailHeader'
import { TimestampField } from '/src/containers/fieldFormat'

const EventDetail = ({ id, setSelectedEvent }) => {
  const { data: event, isLoading } = useGetEventByIdQuery({ id }, { skip: !id })

  if (isLoading || !event || !id) return null

  // const isLog = event.topic.startsWith('log.')
  console.log(event)

  const { description, user, summary, project, payload } = event

  return (
    <Section className={'wrap'}>
      <DetailHeader onClose={() => setSelectedEvent(null)} context={event}>
        <div style={{ overflow: 'hidden' }}>
          <h2>{event.topic}</h2>
          <TimestampField value={event.updatedAt} />
        </div>
      </DetailHeader>
      <Panel
        style={{
          overflow: 'hidden',
        }}
      >
        <div>
          <h2>Description</h2>
          <span>{description}</span>
        </div>
        {payload.message && (
          <div>
            <h2>Message</h2>
            <span>{payload.message}</span>
          </div>
        )}
        {user && (
          <div>
            <h2>User</h2>
            <span>{user}</span>
          </div>
        )}
        {project && (
          <div>
            <h2>Project</h2>
            <span>{project}</span>
          </div>
        )}
        {summary.entityId && (
          <div>
            <h2>Entity</h2>
            <span>{summary.entityId}</span>
          </div>
        )}
      </Panel>
    </Section>
  )
}

export default EventDetail
