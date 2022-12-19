import { Dropdown } from 'primereact/dropdown'
import { Spacer, Button, Toolbar, Panel, ScrollPanel } from '@ynput/ayon-react-components'

import { useState, useEffect, useMemo } from 'react'
import { toast } from 'react-toastify'
import axios from 'axios'

const AddonListItem = ({ addonName, formData, setFormData }) => {
  const addon = formData[addonName]
  const productionVersion = addon?.productionVersion || null
  const stagingVersion = addon?.stagingVersion || null

  const options = useMemo(() => {
    return [
      { label: '(NONE)', value: null },
      ...addon.versions.map((version) => {
        return {
          label: version,
          value: version,
        }
      }),
    ]
  }, [addon.versions])

  const onProductionChange = (e) => {
    setFormData((fd) => {
      return {
        ...fd,
        [addonName]: { ...addon, productionVersion: e.value },
      }
    })
  }

  const onStagingChange = (e) => {
    setFormData((fd) => {
      return {
        ...fd,
        [addonName]: { ...addon, stagingVersion: e.value },
      }
    })
  }

  return (
    <Panel style={{ width: 800, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <div style={{ flexBasis: 300 }}>{addon.title}</div>
      <Spacer />
      <span>Production</span>
      <Dropdown
        style={{ width: 200 }}
        options={options}
        value={productionVersion}
        placeholder="(NONE)"
        onChange={onProductionChange}
      />
      <span>Staging</span>
      <Dropdown
        style={{ width: 200 }}
        options={options}
        value={stagingVersion}
        placeholder="(NONE)"
        onChange={onStagingChange}
      />
    </Panel>
  )
}

// eslint-disable-next-line no-unused-vars
const AddonVersions = ({ projectName }) => {
  // eslint-disable-next-line no-unused-vars
  const [originalData, setOriginalData] = useState(null)
  const [formData, setFormData] = useState(null)

  // TODO: use original data to show changes
  // TODO: project specific overrides

  const load = () => {
    axios.get('/api/addons').then((res) => {
      const vers = {}
      for (const addon of res.data.addons) {
        vers[addon.name] = {
          title: addon.title || addon.name,
          versions: Object.keys(addon.versions),
          productionVersion: addon.productionVersion,
          stagingVersion: addon.stagingVersion,
        }
      }

      setFormData(vers)
      setOriginalData(vers)
    })
  }

  const submit = () => {
    axios
      .post('/api/addons', { versions: formData })
      .then(() => {
        toast.success('Addons updated')
        load()
      })
      .catch(() => toast.error('Unable to update addons versions'))
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <>
      <Toolbar>
        <Button label="Save" icon="check" onClick={submit} />
      </Toolbar>
      <ScrollPanel style={{ flexGrow: 1, backgroundColor: 'transparent' }}>
        <Spacer>
          <section
            className="invisible"
            style={{ gap: 6, display: 'flex', flexDirection: 'column' }}
          >
            {formData &&
              Object.keys(formData).map((addonName) => (
                <AddonListItem
                  key={addonName}
                  addonName={addonName}
                  formData={formData}
                  setFormData={setFormData}
                />
              ))}
          </section>
        </Spacer>
      </ScrollPanel>
    </>
  )
}

export default AddonVersions
