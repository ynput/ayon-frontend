import React from 'react'

import { Dialog } from 'primereact/dialog'
import { useGetEventByIdQuery } from '/src/services/events/getEvents'

const EventDetail = ({ id, onHide }) => {
  const { data: event, isLoading } = useGetEventByIdQuery({ id }, { skip: !id })

  if (isLoading || !event || !id) return null

  // const isLog = event.topic.startsWith('log.')

  return (
    <Dialog onHide={onHide} visible>
      <pre>{event.description}</pre>
    </Dialog>
  )
}

export default EventDetail
