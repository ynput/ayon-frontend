import axios from 'axios'
import { useState, useEffect, useMemo } from 'react'
import { toast } from 'react-toastify'
import { rcompare } from 'semver'
import { Dialog } from 'primereact/dialog'
import { Dropdown } from 'primereact/dropdown'
import {
  FormLayout,
  FormRow,
  Spacer,
  InputText,
  InputTextarea,
  SaveButton,
  Button,
  Toolbar,
} from '@ynput/ayon-react-components'
import VariantSelector from '/src/containers/AddonSettings/VariantSelector'

const NewServiceDialog = ({ onHide, onSpawn }) => {
  const [addonData, setAddonData] = useState([])
  const [hostData, setHostData] = useState([])
  const [serviceName, setServiceName] = useState('')
  const [selectedAddon, setSelectedAddon] = useState(null)
  const [selectedVersion, setSelectedVersion] = useState(null)
  const [selectedService, setSelectedService] = useState(null)
  const [selectedHost, setSelectedHost] = useState(null)
  const [settingsVariant, setSettingsVariant] = useState('production')
  const [storages, setStorages] = useState('')

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
      .sort((a, b) => rcompare(a, b))
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
    /*
    volumes: list[str] | None = Field(None, title="Volumes", example=["/tmp:/tmp"])
    ports: list[str] | None = Field(None, title="Ports", example=["8080:8080"])
    mem_limit: str | None = Field(None, title="Memory Limit", example="1g")
    user: str | None = Field(None, title="User", example="1000")
    env: dict[str, Any] = Field(default_factory=dict)
    */

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

    axios
      .put(`/api/services/${serviceName}`, {
        addonName: selectedAddon.name,
        addonVersion: selectedVersion,
        service: selectedService,
        hostname: selectedHost,
        config: serviceConfig,
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

        <FormRow label="Settings variant">
          <VariantSelector
            addonName={selectedAddon?.name}
            addonVersion={selectedVersion}
            variant={settingsVariant}
            setVariant={setSettingsVariant}
          />
        </FormRow>

        <FormRow label="Service name">
          <InputText value={serviceName} onChange={(e) => setServiceName(e.target.value)} />
        </FormRow>

        <FormRow label="Storages">
          <InputTextarea
            value={storages}
            onChange={(e) => setStorages(e.target.value)}
            placeholder="/local/path:/container/path"
          />
        </FormRow>
      </FormLayout>
    </Dialog>
  )
}

export default NewServiceDialog
