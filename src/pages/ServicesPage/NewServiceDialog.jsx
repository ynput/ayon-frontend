import { useState, useMemo, useEffect } from 'react'
import { toast } from 'react-toastify'
import { compareBuild } from 'semver'
import { Dialog, Dropdown } from '@ynput/ayon-react-components'
import {
  FormLayout,
  FormRow,
  Divider,
  Spacer,
  InputText,
  InputTextarea,
  SaveButton,
  Button,
  Toolbar,
} from '@ynput/ayon-react-components'
import VariantSelector from '@containers/AddonSettings/VariantSelector'
import { useSpawnServiceMutation, usePatchServiceMutation } from '@queries/services/updateServices'
import { useGetServiceAddonsQuery, useListHostsQuery } from '@queries/services/getServices'
import { confirmDialog } from 'primereact/confirmdialog'
import { Label } from '@components/ReviewablesSelector/ReviewablesSelector.styled'

// Function to validate bucket name
const validateServiceName = (name) => {
  // Check length
  if (name.length < 3 || name.length > 63) {
    return 'Bucket name must be between 3 and 63 characters long'
  }

  // Check for valid characters (lowercase letters, numbers, dots, hyphens)
  if (!/^[a-z0-9.-]+$/.test(name)) {
    return 'Bucket name can only contain lowercase letters, numbers, dots, and hyphens'
  }

  // Check beginning and end
  if (!/^[a-z0-9].*[a-z0-9]$/.test(name)) {
    return 'Bucket name must begin and end with a letter or number'
  }

  // Check for adjacent periods
  if (/\.\./.test(name)) {
    return 'Bucket name must not contain two adjacent periods'
  }

  // Check if formatted as IP address
  if (/^\d+\.\d+\.\d+\.\d+$/.test(name)) {
    return 'Bucket name must not be formatted as an IP address'
  }

  return null // null means valid
}

// Function to sanitize bucket name during typing
const sanitizeServiceName = (name) => {
  if (!name) return ''

  // Convert to lowercase
  let sanitized = name.toLowerCase()

  // Remove invalid characters
  sanitized = sanitized.replace(/[^a-z0-9.-]/g, '')

  // Remove consecutive dots
  sanitized = sanitized.replace(/\.{2,}/g, '.')

  return sanitized
}

const ServiceDialog = ({ onHide, editService = null }) => {
  const isEditMode = !!editService
  const [serviceName, setServiceName] = useState('')
  const [selectedAddon, setSelectedAddon] = useState(null)
  const [selectedVersion, setSelectedVersion] = useState(null)
  const [selectedService, setSelectedService] = useState(null)
  const [selectedHost, setSelectedHost] = useState(null)
  const [settingsVariant, setSettingsVariant] = useState('production')
  const [storages, setStorages] = useState('')
  const [ports, setPorts] = useState('')
  const [envVars, setEnvVars] = useState('')

  const { data: addonData = [] } = useGetServiceAddonsQuery({})
  const { data: hostsData } = useListHostsQuery()
  const { hosts = [] } = hostsData || {}

  // Initialize form with existing service data when in edit mode
  useEffect(() => {
    if (isEditMode) {
      setServiceName(editService.name)
      setSelectedHost(editService.hostname)

      // Find the addon object that matches the editService.addonName
      const addon = addonData.find((ad) => ad.name === editService.addonName)
      if (addon) {
        setSelectedAddon(addon)
        setSelectedVersion(editService.addonVersion)
        setSelectedService(editService.service)
      }

      // Set settings variant if available
      const variant = editService.data?.env?.AYON_DEFAULT_SETTINGS_VARIANT
      if (variant) setSettingsVariant(variant)

      // Set storages if available
      const volumes = editService.data?.volumes
      if (volumes && volumes.length) {
        setStorages(volumes.join('\n'))
      }

      // Set ports if available
      const ports = editService.data?.ports
      if (ports && ports.length) {
        setPorts(ports.join('\n'))
      }

      // Set envVars if available
      const envVars = editService.data?.env
      if (envVars && Object.keys(envVars).length) {
        setEnvVars(Object.entries(envVars).map(([key, value]) => `${key}=${value}`).join('\n'))
      }
    }
  }, [isEditMode, editService, addonData])

  // Handle service name change with validation
  const handleServiceNameChange = (e) => {
    const rawValue = e.target.value
    const sanitized = sanitizeServiceName(rawValue)
    setServiceName(sanitized)
  }

  const hostOptions = useMemo(() => {
    return hosts.map((h) => {
      return { value: h.name, label: h.name }
    })
  }, [hosts])

  const addonOptions = useMemo(() => {
    return addonData.map((ad) => {
      return { value: ad, label: ad.title }
    })
  }, [addonData])

  const versionOptions = useMemo(() => {
    if (!selectedAddon) return []
    return Object.keys(selectedAddon.versions)
      .filter((v) => Object.keys(selectedAddon.versions[v].services || []).length)
      .sort((a, b) => -1 * compareBuild(a, b))
      .map((v) => {
        return { value: v, label: `${selectedAddon.title} ${v}` }
      })
  }, [selectedAddon?.name])

  const serviceOptions = useMemo(() => {
    if (!selectedVersion) return []
    const services = selectedAddon.versions[selectedVersion]?.services || {}
    return Object.keys(services).map((v) => {
      return { value: v, label: v }
    })
  }, [selectedVersion, selectedAddon?.name])

  const [spawnService, { isLoading: isCreating }] = useSpawnServiceMutation()
  const [patchService, { isLoading: isUpdating }] = usePatchServiceMutation()

  const isLoading = isCreating || isUpdating

  const submit = async () => {
    // Validate bucket name before submitting
    const error = validateServiceName(serviceName)
    if (error && !isEditMode) {
      toast.error(`Invalid service name: ${error}`)
      return
    }

    const serviceConfig = {
      volumes: [],
      ports: [],
      mem_limit: null,
      user: null,
      env: {},
    }
    if (settingsVariant !== 'production') {
      serviceConfig.env.AYON_DEFAULT_SETTINGS_VARIANT = settingsVariant
    }

    if (storages) {
      serviceConfig.volumes = storages.split('\n').map((s) => s.trim())
    }

    if (ports) {
      serviceConfig.ports = ports.split('\n').map((s) => s.trim())
    }

    if (envVars) {
      serviceConfig.env = envVars.split('\n').reduce((acc, line) => {
        const [key, value] = line.split('=')
        if (key && value) {
          acc[key.trim()] = value.trim()
        }
        return acc
      }, {})
    }

    const serviceData = {
      addonName: selectedAddon.name,
      addonVersion: selectedVersion,
      service: selectedService,
      hostname: selectedHost,
      config: serviceConfig,
    }

    try {
      if (isEditMode) {
        // Update existing service
        await patchService({
          serviceName: editService.name,
          patchServiceRequestModel: {
            hostname: selectedHost,
            ...serviceConfig,
          },
        }).unwrap()

        // hide dialog
        onHide()

        // If service was previously running, ask if user wants to start it again
        if (editService.shouldRun === false) {
          confirmDialog({
            message: 'Do you want to start the service now?',
            header: 'Start Service',
            acceptLabel: 'Yes, start service',
            rejectLabel: 'No, keep stopped',
            accept: async () => {
              try {
                await patchService({
                  serviceName: editService.name,
                  patchServiceRequestModel: { shouldRun: true },
                }).unwrap()
                toast.success('Service started')
              } catch (error) {
                toast.error(`Unable to start service: ${error.data?.detail || error.message}`)
              }
            },
            reject: () => {
              // Do nothing, service remains stopped
            },
          })
        } else {
          toast.success(`Service updated`)
          onHide()
        }
      } else {
        // Create new service
        await spawnService({ name: serviceName, spawnServiceRequestModel: serviceData }).unwrap()
        toast.success(`Service spawned`)
        onHide()
      }
    } catch (error) {
      console.log(error)
      toast.error(`Unable to ${isEditMode ? 'update' : 'spawn'} service: ${error.data?.detail}`)
    }
  }

  const canSubmit = isEditMode
    ? !!selectedHost
    : selectedAddon?.name &&
      selectedVersion &&
      selectedService &&
      selectedHost &&
      serviceName?.length

  const footer = (
    <Toolbar>
      <Spacer />
      <Button label="Cancel" onClick={onHide} variant="text" />
      <SaveButton
        label={isEditMode ? 'Update' : 'Spawn'}
        active={canSubmit}
        saving={isLoading}
        onClick={submit}
      />
    </Toolbar>
  )

  return (
    <Dialog
      isOpen={true}
      header={isEditMode ? 'Edit service' : 'Spawn a new service'}
      onClose={onHide}
      footer={footer}
      style={{ width: 550, maxHeight: '600px', zIndex: 999 }}
      size="lg"
    >
      <FormLayout>
        <FormRow label="Host">
          <Dropdown
            options={hostOptions}
            value={[selectedHost]}
            onChange={(e) => setSelectedHost(e[0])}
            placeholder="Select a host..."
          />
        </FormRow>

        {!isEditMode && (
          <>
            <FormRow label="Addon name">
              <Dropdown
                options={addonOptions}
                value={[selectedAddon]}
                onChange={(e) => {
                  setSelectedAddon(e[0])
                  setSelectedVersion(null)
                  setSelectedService(null)
                  setServiceName('')
                }}
                placeholder="Select an addon..."
              />
            </FormRow>

            <FormRow label="Addon version">
              <Dropdown
                options={versionOptions}
                value={[selectedVersion]}
                onChange={(e) => setSelectedVersion(e[0])}
                placeholder="Select a version..."
              />
            </FormRow>

            <FormRow label="Service">
              <Dropdown
                options={serviceOptions}
                value={[selectedService]}
                onChange={(e) => {
                  setSelectedService(e[0])
                  setServiceName(sanitizeServiceName(e[0]))
                }}
                disabled={!selectedVersion}
                placeholder="Select a service..."
              />
            </FormRow>

            <FormRow label="Service name">
              <InputText value={serviceName} onChange={handleServiceNameChange} />
            </FormRow>
          </>
        )}

        {isEditMode && (
          <FormRow label="Service name">
            <InputText value={serviceName} disabled />
          </FormRow>
        )}
      </FormLayout>

      <Divider>Advanced settings</Divider>

      <FormLayout>
        <FormRow label="Settings variant">
          <VariantSelector
            addonName={selectedAddon?.name}
            addonVersion={selectedVersion}
            variant={settingsVariant}
            setVariant={setSettingsVariant}
          />
        </FormRow>

        <FormRow label="Storages">
          <InputTextarea
            value={storages}
            style={{ minHeight: 80 }}
            onChange={(e) => setStorages(e.target.value)}
            placeholder="/local/path:/container/path"
          />
        </FormRow>
        
        <FormRow label="Ports">
          <InputTextarea
            value={ports}
            style={{ minHeight: 40 }}
            onChange={(e) => setPorts(e.target.value)}
            placeholder="8080:8080"
          />
          Add multiple ports by adding them on a new line.
        </FormRow>
        <FormRow label="Environment">
          <InputTextarea
            value={envVars}
            style={{ minHeight: 40 }}
            onChange={(e) => setEnvVars(e.target.value)}
            placeholder="LOGLEVEL=INFO"
          />
          Add multiple environment variables by adding them on a new line.
        </FormRow>
      </FormLayout>
    </Dialog>
  )
}

export default ServiceDialog
