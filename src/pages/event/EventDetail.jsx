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

  return (
    <Section className={'wrap'}>
      <DetailHeader onClose={() => setSelectedEvent(null)}>
        <div>
          <h2>{event.topic}</h2>
          <TimestampField value={event.updatedAt} />
        </div>
      </DetailHeader>
      <Panel>
        <h2>Description</h2>
        <span>{event.description}</span>
      </Panel>
    </Section>
  )
}

export default EventDetail
