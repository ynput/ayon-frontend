import axios from 'axios'
import { useState, useEffect, useMemo } from 'react'
import { toast } from 'react-toastify'
import { Dialog } from 'primereact/dialog'
import { Dropdown } from 'primereact/dropdown'
import {
  FormLayout,
  FormRow,
  Spacer,
  InputText,
  SaveButton,
  Button,
  Toolbar,
} from '@ynput/ayon-react-components'

const NewServiceDialog = ({ onHide, onSpawn }) => {
  const [addonData, setAddonData] = useState([])
  const [hostData, setHostData] = useState([])
  const [serviceName, setServiceName] = useState('')
  const [selectedAddon, setSelectedAddon] = useState(null)
  const [selectedVersion, setSelectedVersion] = useState(null)
  const [selectedService, setSelectedService] = useState(null)
  const [selectedHost, setSelectedHost] = useState(null)

  useEffect(() => {
    axios.get('/api/addons?details=1').then((response) => {
      const addons = response.data.addons
      const addonsWithServices = addons.filter((a) => {
        return Object.keys(a.versions).some((v) => {
          return Object.keys(a.versions[v].services || []).length
        })
      })
      setAddonData(addonsWithServices)
    })
    axios.get('/api/hosts').then((response) => setHostData(response.data.hosts))
  }, [])

  const hostOptions = useMemo(() => {
    return hostData.map((h) => {
      return { value: h.name, label: h.name }
    })
  }, [hostData])

  const addonOptions = useMemo(() => {
    return addonData.map((ad) => {
      return { value: ad, label: ad.title }
    })
  }, [addonData])

  const versionOptions = useMemo(() => {
    if (!selectedAddon) return []
    return Object.keys(selectedAddon.versions)
      .filter((v) => Object.keys(selectedAddon.versions[v].services || []).length)
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

  const submit = () => {
    axios
      .put(`/api/services/${serviceName}`, {
        addonName: selectedAddon.name,
        addonVersion: selectedVersion,
        service: selectedService,
        hostname: selectedHost,
      })
      .then(() => {
        toast.success(`Service spawned`)
        onSpawn()
      })
      .catch((err) => {
        toast.error(`Unable to spawn service ${err.message}`)
      })
  }

  const canSubmit =
    selectedAddon?.name && selectedVersion && selectedService && selectedHost && serviceName?.length

  const footer = (
    <Toolbar>
      <Spacer />
      <Button label="Cancel" onClick={onHide} variant="text" />
      <SaveButton label="Spawn" icon="settings_slow_motion" active={canSubmit} onClick={submit} />
    </Toolbar>
  )

  return (
    <Dialog visible={true} header="New service" onHide={onHide} footer={footer}>
      <FormLayout>
        <FormRow label="Host">
          <Dropdown
            options={hostOptions}
            value={selectedHost}
            onChange={(e) => setSelectedHost(e.value)}
          />
        </FormRow>

        <FormRow label="Addon name">
          <Dropdown
            options={addonOptions}
            value={selectedAddon}
            onChange={(e) => setSelectedAddon(e.value)}
          />
        </FormRow>

        <FormRow label="Addon version">
          <Dropdown
            options={versionOptions}
            value={selectedVersion}
            onChange={(e) => setSelectedVersion(e.value)}
          />
        </FormRow>

        <FormRow label="Service">
          <Dropdown
            options={serviceOptions}
            value={selectedService}
            onChange={(e) => {
              setSelectedService(e.value)
              setServiceName(e.value)
            }}
          />
        </FormRow>

        <FormRow label="Service name">
          <InputText value={serviceName} onChange={(e) => setServiceName(e.target.value)} />
        </FormRow>
      </FormLayout>
    </Dialog>
  )
}

export default NewServiceDialog
