import axios from 'axios'
import { useState, useEffect } from 'react'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { TablePanel, Section } from '@ynput/ayon-react-components'

import { TimestampField } from '/src/containers/fieldFormat'

const SessionList = ({ userName }) => {
  const [sessionList, setSessionList] = useState([])
  const [loading, setLoading] = useState(false)

  const loadSessions = () => {
    setLoading(true)
    axios
      .get(`/api/users/${userName}/sessions`)
      .then((response) => {
        console.log(response.data)
        setSessionList(response.data.sessions)
      })
      .catch(() => {
        console.log('Unable to load sessions')
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    loadSessions()
  }, [])

  return (
    <Section style={{ flexGrow: 2 }}>
      <TablePanel loading={loading}>
        <DataTable
          value={sessionList}
          scrollable="true"
          scrollHeight="flex"
          responsive="true"
          selectionMode="single"
        >
          <Column field="clientInfo.ip" header="IP" />
          <Column field="clientInfo.agent.platform" header="Platform" style={{ maxWidth: 160 }} />
          <Column field="clientInfo.agent.client" header="Client" style={{ maxWidth: 160 }} />
          <Column field="clientInfo.agent.device" header="Device" style={{ maxWidth: 160 }} />
          <Column field="clientInfo.location.country" header="Country" style={{ maxWidth: 160 }} />
          <Column field="clientInfo.location.city" header="City" style={{ maxWidth: 160 }} />
          <Column
            field="lastUsed"
            header="Last active"
            body={(rowData) => rowData.lastUsed && <TimestampField value={rowData.lastUsed} />}
            style={{ maxWidth: 160 }}
          />
        </DataTable>
      </TablePanel>
    </Section>
  )
}

export default SessionList
