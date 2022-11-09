import { Dropdown } from 'primereact/dropdown'
import { Spacer, Button, Toolbar, Panel } from 'openpype-components'

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
    <Panel style={{ width: 800, flexDirection: 'row', alignItems: 'center' }}>
      <div style={{ flexBasis: 300 }}>{addon.title}</div>
      <Spacer />
      <div className="p-inputgroup">
        <span className="p-inputgroup-addon">Production</span>
        <Dropdown
          style={{ width: 200 }}
          options={options}
          value={productionVersion}
          placeholder="(NONE)"
          onChange={onProductionChange}
        />
      </div>
      <div className="p-inputgroup">
        <span className="p-inputgroup-addon">Staging</span>
        <Dropdown
          style={{ width: 200 }}
          options={options}
          value={stagingVersion}
          placeholder="(NONE)"
          onChange={onStagingChange}
        />
      </div>
    </Panel>
  )
}

const AddonVersions = ({ projectName }) => {
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
      <section className="invisible">
        <Spacer>
          <section className="invisible">
            {formData &&
              Object.keys(formData).map((addonName) => (
                <AddonListItem
                  addonName={addonName}
                  formData={formData}
                  setFormData={setFormData}
                />
              ))}
          </section>
        </Spacer>
      </section>
    </>
  )
}

export default AddonVersions
