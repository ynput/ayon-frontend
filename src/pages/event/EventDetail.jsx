import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Dialog } from 'primereact/dialog'

const EventDetail = ({ eventId, onHide }) => {
  const [eventData, setEventData] = useState(null)

  useEffect(() => {
    if (!eventId) {
      onHide()
      return
    }

    axios.get(`/api/events/${eventId}`).then((response) => {
      const event = response.data
      if (event.topic.startsWith('log.')) {
        setEventData(event.payload.message)
        return
      }
      setEventData(JSON.stringify(event.payload, null, 2))
    })
  }, [eventId])

  return (
    <Dialog onHide={onHide} visible={true}>
      <pre>{eventData}</pre>
    </Dialog>
  )
}

export default EventDetail
