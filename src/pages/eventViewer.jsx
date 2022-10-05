import { useState, useEffect } from 'react'
import axios from 'axios'
import { DateTime } from 'luxon'

import { Dialog } from 'primereact/dialog'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { TableWrapper } from '/src/components'

const EVENTS_QUERY = `
query Events {
    events(last: 100) {
      edges {
        node {
          id
          topic
          user
          project
          description
          updatedAt
        }
      }
    }
}
`

const EventDetailDialog = ({ eventId, onHide }) => {
  const [eventData, setEventData] = useState(null)

  useEffect(() => {
    if (!eventId) {
      onHide()
      return
    }

    axios.get(`/api/events/${eventId}`).then((response) => {
      setEventData(response.data)
    })
  }, [eventId])

  return (
    <Dialog onHide={onHide} visible={true}>
      <pre>{JSON.stringify(eventData, null, 2)}</pre>
    </Dialog>
  )
}

const EventViewer = () => {
  const [eventData, setEventData] = useState([])
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [detailVisible, setDetailVisible] = useState(false)

  const loadEventData = () => {
    axios
      .post('/graphql', {
        query: EVENTS_QUERY,
        variables: {},
      })
      .then((response) => {
        if (!response.data?.data?.events) return

        let result = []
        for (const edge of response.data.data.events.edges) {
          result.push({
            id: edge.node.id,
            topic: edge.node.topic,
            user: edge.node.user,
            project: edge.node.project,
            description: edge.node.description,
            updatedAt: edge.node.updatedAt,
          })
        }
        setEventData(result)
      })
  }

  const handlePubSub = (topic, message) => {
    if (topic === 'client.reconnected') {
      loadEventData()
      return
    }
    setEventData((ed) => {
      return [message, ...ed]
    })
  }

  useEffect(() => {
    const token = PubSub.subscribe('*', handlePubSub)
    return () => PubSub.unsubscribe(token)
  }, [])

  useEffect(() => {
    loadEventData()
    // eslint-disable-next-line
  }, [])

  const formatTime = (rowData) => {
    return DateTime.fromSeconds(rowData.updatedAt).toRelative()
  }

  const onRowClick = (e) => {
    if (e.originalEvent.detail === 2) {
      setDetailVisible(true)
    }
  }

  return (
    <main>
      <section style={{ flexGrow: 1 }}>
        {detailVisible && (
          <EventDetailDialog
            onHide={() => setDetailVisible(false)}
            eventId={selectedEvent?.id}
          />
        )}
        <TableWrapper>
          <DataTable
            value={eventData}
            scrollable="true"
            scrollHeight="flex"
            responsive="true"
            dataKey="id"
            selectionMode="single"
            onSelectionChange={(e) => setSelectedEvent(e.value)}
            selection={selectedEvent}
            onRowClick={onRowClick}
          >
            <Column header="Time" body={formatTime} style={{ width: 200 }} />
            <Column header="Topic" field="topic" style={{ width: 200 }} />
            <Column header="User" field="user" style={{ width: 200 }} />
            <Column header="Project" field="project" style={{ width: 200 }} />
            <Column header="Description" field="description" />
          </DataTable>
        </TableWrapper>
      </section>
    </main>
  )
}

export default EventViewer
