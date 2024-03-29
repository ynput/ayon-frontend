import axios from 'axios'
import { useEffect, useState, useMemo, useCallback } from 'react'
import { toast } from 'react-toastify'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { TablePanel, Button, Spacer, Section, Toolbar } from '@ynput/ayon-react-components'
import NewServiceDialog from './NewServiceDialog'
import useCreateContext from '/src/hooks/useCreateContext'
import confirmDelete from '/src/helpers/confirmDelete'
import styled from 'styled-components'

const StatusBadge = styled.span`
  display: inline-block;
  padding: 1px 6px;
  border-radius: 0.25rem;
  color: #fff;
  font-size: 0.8rem;

  &.running {
    background-color: #28a745;
  }

  &.not-running {
    background-color: #dc3545;
  }

  &.stopping {
    background-color: #ffc107;
  }

  &.disabled {
    background-color: #007bff;
  }

  &.unreachable {
    background-color: #ff1010;
  }
`

const formatStatus = (rowData) => {
  if (rowData.lastSeenDelta === undefined || rowData.lastSeenDelta === null)
    return <StatusBadge>Unknown</StatusBadge>
  if (rowData.lastSeenDelta > 10000)
    return <StatusBadge className="unreachable">Worker unreachable</StatusBadge>

  if (!rowData.shouldRun)
    return rowData.isRunning ? (
      <StatusBadge className="stopping">Stopping</StatusBadge>
    ) : (
      <StatusBadge className="disabled">Disabled</StatusBadge>
    )

  return rowData.isRunning ? (
    <StatusBadge className="running">Running</StatusBadge>
  ) : (
    <StatusBadge className="not-running">Not running</StatusBadge>
  )
}

const ServicesPage = () => {
  const [services, setServices] = useState([])
  const [showNewService, setShowNewService] = useState(false)
  const [selectedServices, setSelectedServices] = useState([])

  useEffect(() => {
    //preselect the first service
    // (to avoid empty selection, with which context menu behaves weirdly)

    if (services?.length && !selectedServices.length) {
      setSelectedServices([services[0].name])
    }
  }, [services, selectedServices])

  const loadServices = () => {
    axios.get('/api/services').then((response) => {
      setServices(response.data.services)
    })
  }

  const deleteSelected = (selected) => {
    confirmDelete({
      label: 'Services',
      accept: async () => {
        const patches = selected ? selected : selectedServices
        for (const serviceName of patches) {
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

  const enableSelected = (selected) => {
    const patches = selected ? selected : selectedServices
    for (const serviceName of patches) {
      axios
        .patch(`/api/services/${serviceName}`, { shouldRun: true })
        .then(() => toast.success(`${serviceName} enabled`))
        .catch(() => toast.error(`Unable to enable ${serviceName}`))
        .finally(() => loadServices())
    }
  }
  const disableSelected = (selected) => {
    const patches = selected ? selected : selectedServices
    for (const serviceName of patches) {
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

  const getCtxMenuItems = useCallback(
    (data) => {
      const serviceName = data?.name

      const services = selectedServices.includes(serviceName) ? selectedServices : [serviceName]

      return [
        {
          label: 'Start selected',
          disabled: !services.length,
          command: () => enableSelected(services),
          icon: 'check',
        },
        {
          label: 'Stop selected',
          disabled: !services.length,
          command: () => disableSelected(services),
          icon: 'cancel',
        },
        {
          label: 'Delete selected',
          disabled: !services.length,
          command: () => deleteSelected(services),
          danger: true,
          icon: 'delete',
        },
      ]
    },
    [selectedServices],
  )

  const [ctxMenuShow] = useCreateContext([])

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
            onContextMenu={(e) => ctxMenuShow(e.originalEvent, getCtxMenuItems(e.data))}
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
            <Column field="data.env.AYON_DEFAULT_SETTINGS_VARIANT" header="Settings variant" />
            <Column
              field="isRunning"
              header="Status"
              body={formatStatus}
              style={{ maxWidth: 130, textAlign: 'center' }}
            />
          </DataTable>
        </TablePanel>
      </Section>
    </main>
  )
}

export default ServicesPage
