import axios from 'axios'
import { useEffect, useState, useRef, useMemo } from 'react'
import { toast } from 'react-toastify'
import { DateTime } from 'luxon'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { ContextMenu } from 'primereact/contextmenu'
import { TableWrapper, Button, Spacer } from '/src/components'
import NewServiceDialog from './newService'

const formatTime = (rowData) => {
  return rowData.lastSeen
    ? DateTime.fromSeconds(rowData.lastSeen).toRelative()
    : 'Never'
}

const formatStatus = (rowData) => {
  if (!rowData.shouldRun) return rowData.isRunning ? 'STOPPING' : 'DISABLED'
  return rowData.isRunning ? 'RUNNING' : 'NOT RUNNING'
}

const ServicesPage = () => {
  const [services, setServices] = useState([])
  const [showNewService, setShowNewService] = useState(false)
  const [selectedServices, setSelectedServices] = useState([])
  const contextMenuRef = useRef(null)

  const loadServices = () => {
    axios.get('/api/services').then((response) => {
      setServices(response.data.services)
    })
  }

  const deleteSelected = () => {
    for (const serviceName of selectedServices) {
      axios
        .delete(`/api/services/${serviceName}`)
        .then(() => toast.success(`${serviceName} deleted`))
        .catch(() => toast.error(`Unable to delete ${serviceName}`))
        .finally(() => loadServices())
    }
  }

  const enableSelected = () => {
    for (const serviceName of selectedServices) {
      axios
        .patch(`/api/services/${serviceName}`, { shouldRun: true })
        .then(() => toast.success(`${serviceName} enabled`))
        .catch(() => toast.error(`Unable to enable ${serviceName}`))
        .finally(() => loadServices())
    }
  }
  const disableSelected = () => {
    for (const serviceName of selectedServices) {
      axios
        .patch(`/api/services/${serviceName}`, { shouldRun: false })
        .then(() => toast.success(`${serviceName} disabled`))
        .catch(() => toast.error(`Unable to disable ${serviceName}`))
        .finally(() => loadServices())
    }
  }

  useEffect(() => {
    loadServices()
    const interval = setInterval(() => {
      loadServices()
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  const selection = useMemo(() => {
    return services.filter((i) => selectedServices.includes(i.name))
  }, [selectedServices, services])

  const contextMenuModel = useMemo(() => {
    return [
      {
        label: 'Delete selected',
        disabled: !selectedServices?.length,
        command: deleteSelected,
      },
      {
        label: 'Enable selected',
        disabled: !selectedServices?.length,
        command: enableSelected,
      },
      {
        label: 'Disable selected',
        disabled: !selectedServices?.length,
        command: disableSelected,
      },
    ]
  }, [selectedServices])

  return (
    <main className="rows">
      {showNewService && (
        <NewServiceDialog
          onHide={() => setShowNewService(false)}
          onSpawn={loadServices}
        />
      )}
      <section className="invisible row">
        <Button label="New service" onClick={() => setShowNewService(true)} />
        <Spacer />
      </section>
      <section style={{ flexGrow: 1 }}>
        <TableWrapper>
          <ContextMenu model={contextMenuModel} ref={contextMenuRef} />
          <DataTable
            value={services}
            scrollable="true"
            scrollHeight="flex"
            dataKey="name"
            selectionMode="multiple"
            selection={selection}
            onContextMenu={(e) => contextMenuRef.current.show(e.originalEvent)}
            onSelectionChange={(e) =>
              setSelectedServices(e.value.map((i) => i.name))
            }
            onContextMenuSelectionChange={(e) => {
              if (!selectedServices.includes(e.value.name))
                setSelectedServices([...selectedServices, e.value.name])
            }}
          >
            <Column field="name" header="Service name" />
            <Column field="addonName" header="Addon name" />
            <Column field="addonVersion" header="Addon version" />
            <Column field="service" header="Service" />
            <Column field="hostname" header="Host" />
            <Column
              field="isRunning"
              header="Status"
              body={formatStatus}
              style={{ maxWidth: 120 }}
            />
            <Column field="lastSeen" header="Last seen" body={formatTime} />
          </DataTable>
        </TableWrapper>
      </section>
    </main>
  )
}

export default ServicesPage
