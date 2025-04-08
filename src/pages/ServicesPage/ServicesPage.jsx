import { useState, useMemo, useCallback } from 'react'
import { toast } from 'react-toastify'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { TablePanel, Button, Spacer, Section, Toolbar } from '@ynput/ayon-react-components'
import NewServiceDialog from './NewServiceDialog'
import useCreateContext from '@hooks/useCreateContext'
import confirmDelete from '@helpers/confirmDelete'
import styled from 'styled-components'
import { useListServicesQuery } from '@queries/services/getServices'
import { useDeleteServiceMutation, usePatchServiceMutation } from '@queries/services/updateServices'

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
  const [showNewService, setShowNewService] = useState(false)
  const [selectedServices, setSelectedServices] = useState([])

  const { data: servicesData } = useListServicesQuery(undefined, {
    pollingInterval: 2000,
  })
  const { services = [] } = servicesData || {}

  const [deleteService] = useDeleteServiceMutation()

  const deleteSelected = (selected) => {
    confirmDelete({
      label: 'Services',
      accept: async () => {
        const patches = selected ? selected : selectedServices

        const promises = patches.map((serviceName) => {
          return deleteService({ name: serviceName }).unwrap()
        })

        try {
          await Promise.all(promises)
          toast.success(`Services deleted`)
        } catch (error) {
          toast.error(error.data?.detail || 'Unable to delete services')
        }
      },
      showToasts: false,
    })
  }

  const [patchService] = usePatchServiceMutation()

  const toggleShouldRun = async (selected, shouldRun) => {
    const patches = selected ? selected : selectedServices

    const promises = patches.map((serviceName) => {
      return patchService({ serviceName, patchServiceRequestModel: { shouldRun } }).unwrap()
    })

    try {
      await Promise.all(promises)
      toast.success(`Services ${shouldRun ? 'started' : 'stopped'}`)
    } catch (error) {
      toast.error(error.data?.detail || 'Unable to stop/start services')
    }
  }

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
          command: () => toggleShouldRun(services, true),
          icon: 'check',
        },
        {
          label: 'Stop selected',
          disabled: !services.length,
          command: () => toggleShouldRun(services, false),
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
      {showNewService && <NewServiceDialog onHide={() => setShowNewService(false)} />}
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
            <Column field="name" header="Service name" sortable />
            <Column field="addonName" header="Addon name" sortable />
            <Column field="addonVersion" header="Addon version" sortable />
            <Column field="service" header="Service" sortable />
            <Column field="hostname" header="Host" sortable />
            <Column
              field="data.env.AYON_DEFAULT_SETTINGS_VARIANT"
              header="Settings variant"
              sortable
            />
            <Column
              field="isRunning"
              header="Status"
              body={formatStatus}
              style={{ maxWidth: 130, textAlign: 'center' }}
              sortable
            />
          </DataTable>
        </TablePanel>
      </Section>
    </main>
  )
}

export default ServicesPage
