import axios from 'axios'
import { useEffect, useState, useMemo } from 'react'
import { toast } from 'react-toastify'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { TimestampField } from '/src/containers/fieldFormat'
import { TablePanel, Button, Spacer, Section, Toolbar } from '@ynput/ayon-react-components'
import NewServiceDialog from './NewServiceDialog'
import useCreateContext from '/src/hooks/useCreateContext'
import confirmDelete from '/src/helpers/confirmDelete'

const formatStatus = (rowData) => {
  if (!rowData.shouldRun) return rowData.isRunning ? 'STOPPING' : 'DISABLED'
  return rowData.isRunning ? 'RUNNING' : 'NOT RUNNING'
}

const ServicesPage = () => {
  const [services, setServices] = useState([])
  const [showNewService, setShowNewService] = useState(false)
  const [selectedServices, setSelectedServices] = useState([])

  const loadServices = () => {
    axios.get('/api/services').then((response) => {
      setServices(response.data.services)
    })
  }

  const deleteSelected = () => {
    confirmDelete({
      label: 'Services',
      accept: async () => {
        for (const serviceName of selectedServices) {
          try {
            await axios.delete(`/api/services/${serviceName}`)

            toast.success(`${serviceName} deleted`)
          } catch (error) {
            toast.error(`Unable to delete ${serviceName}`)
          }
        }

        loadServices()
      },
      showToasts: false,
    })
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
    if (!services) return []
    return services.filter((i) => selectedServices.includes(i.name))
  }, [selectedServices, services])

  const ctxMenuItems = useMemo(() => {
    return [
      {
        label: 'Enable selected',
        disabled: !selectedServices?.length,
        command: enableSelected,
        icon: 'check',
      },
      {
        label: 'Disable selected',
        disabled: !selectedServices?.length,
        command: disableSelected,
        icon: 'cancel',
      },
      {
        label: 'Delete selected',
        disabled: !selectedServices?.length,
        command: deleteSelected,
        danger: true,
        icon: 'delete',
      },
    ]
  }, [selectedServices])

  const [ctxMenuShow] = useCreateContext(ctxMenuItems)

  return (
    <main>
      {showNewService && (
        <NewServiceDialog onHide={() => setShowNewService(false)} onSpawn={loadServices} />
      )}
      <Section>
        <Toolbar>
          <Button icon="add" label="New service" onClick={() => setShowNewService(true)} />
          <Spacer />
        </Toolbar>
        <TablePanel>
          <DataTable
            value={services}
            scrollable="true"
            scrollHeight="flex"
            dataKey="name"
            selectionMode="multiple"
            selection={selection}
            onContextMenu={(e) => ctxMenuShow(e.originalEvent)}
            onSelectionChange={(e) => setSelectedServices(e.value.map((i) => i.name))}
            onContextMenuSelectionChange={(e) => {
              if (!selectedServices.includes(e.value.name)) setSelectedServices([e.value.name])
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
            <Column
              field="lastSeen"
              header="Last seen"
              body={(rowData) => rowData.lastSeen && <TimestampField value={rowData.lastSeen} />}
            />
          </DataTable>
        </TablePanel>
      </Section>
    </main>
  )
}

export default ServicesPage
