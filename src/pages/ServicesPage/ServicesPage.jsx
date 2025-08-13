import { useState, useMemo, useCallback } from 'react'
import { toast } from 'react-toastify'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Splitter, SplitterPanel } from 'primereact/splitter'
import { TablePanel, Button, Spacer, Section, Toolbar } from '@ynput/ayon-react-components'
import ServiceDialog from './NewServiceDialog'
import ServiceDetailsPanel from './ServiceDetailsPanel'
import { useCreateContextMenu } from '@shared/containers/ContextMenu'
import { confirmDelete } from '@shared/util'
import styled from 'styled-components'
import { useListServicesQuery } from '@queries/services/getServices'
import { useDeleteServiceMutation, usePatchServiceMutation } from '@queries/services/updateServices'
import { confirmDialog } from 'primereact/confirmdialog'
import StickyHelpButton from '@components/StickyHelpButton/StickyHelpButton'

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

const detailsMinWidth = 450
const detailsMaxWidth = '40vw'
const detailsMaxMaxWidth = 700

const ServicesPage = () => {
  const [showServiceDialog, setShowServiceDialog] = useState(false)
  const [editingService, setEditingService] = useState(null)
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

  const handleEditService = (service) => {
    // Check if the service is running (shouldRun is true)
    if (service.shouldRun) {
      confirmDialog({
        message: 'The service must be stopped before editing. Do you want to stop it now?',
        header: 'Stop Service',
        acceptLabel: 'Yes, stop service',
        rejectLabel: 'No, cancel',
        accept: async () => {
          try {
            // Stop the service
            await patchService({
              serviceName: service.name,
              patchServiceRequestModel: { shouldRun: false },
            }).unwrap()

            toast.success('Service stopped')

            // Set small timeout to ensure service has time to update its status
            setEditingService({ ...service, shouldRun: false })
            setShowServiceDialog(true)
          } catch (error) {
            toast.error(`Unable to stop service: ${error.data?.detail || error.message}`)
          }
        },
        reject: () => {
          // Do nothing, dialog will close
        },
      })
    } else {
      // If service is already stopped, open edit dialog directly
      setEditingService(service)
      setShowServiceDialog(true)
    }
  }

  const handleCloseDialog = () => {
    setShowServiceDialog(false)
    setEditingService(null)
  }

  const selection = useMemo(() => {
    if (!services) return []
    return services.filter((i) => selectedServices.includes(i.name))
  }, [selectedServices, services])

  const selectedService = useMemo(() => {
    if (selection.length === 0) return null
    return selection[0]
  }, [selection])

  const getCtxMenuItems = useCallback(
    (data) => {
      const serviceName = data?.name

      const services = selectedServices.includes(serviceName) ? selectedServices : [serviceName]
      const isSingleService = services.length === 1
      const singleService = isSingleService ? services[0] : null

      const serviceObj = isSingleService
        ? servicesData?.services?.find((s) => s.name === singleService)
        : null

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
          label: 'Edit service',
          disabled: !isSingleService,
          command: () => handleEditService(serviceObj),
          icon: 'edit',
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
    [selectedServices, servicesData?.services],
  )

  const [ctxMenuShow] = useCreateContextMenu([])

  return (
    <>
      <StickyHelpButton module="services" />
      <main>
        {showServiceDialog && (
          <ServiceDialog onHide={handleCloseDialog} editService={editingService} />
        )}
        <Section>
          <Toolbar>
            <Button
              icon="add"
              label="New service"
              onClick={() => {
                setEditingService(null)
                setShowServiceDialog(true)
              }}
            />
            <Spacer />
          </Toolbar>
          <Splitter
            layout="horizontal"
            style={{ flex: 1, overflow: 'hidden' }}
            stateKey="services-splitter"
            gutterSize={selectedService ? 4 : 0}
          >
            <SplitterPanel size={70}>
              <TablePanel style={{ height: '100%' }}>
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
            </SplitterPanel>
            {selectedService ? (
              <SplitterPanel size={50}>
                <ServiceDetailsPanel
                  service={selectedService}
                  onClose={() => setSelectedServices([])}
                  onEdit={handleEditService}
                />
              </SplitterPanel>
            ) : (
              <SplitterPanel style={{ maxWidth: 0 }} />
            )}
          </Splitter>
        </Section>
      </main>
    </>
  )
}

export default ServicesPage
