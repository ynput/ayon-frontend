import { Dropdown } from 'primereact/dropdown'
import { Spacer, Button } from '../../components'

import { useState, useEffect, useMemo } from 'react'
import { toast } from 'react-toastify'
import axios from 'axios'

const AddonListItem = ({ addon, formData, setFormData }) => {
  const productionVersion = formData[addon.name]
    ? formData[addon.name].productionVersion
    : addon.productionVersion || null
  const stagingVersion = formData[addon.name]
    ? formData[addon.name].stagingVersion
    : addon.stagingVersion || null

  const options = useMemo(() => {
    setFormData({
      ...formData,
      [addon.name]: { productionVersion, stagingVersion },
    })
    return [
      { label: '(NONE)', value: null },
      ...Object.keys(addon.versions).map((version) => {
        return {
          label: version,
          value: version,
        }
      }),
    ]
  }, [addon.versions])

  const onProductionChange = (e) => {
    const oval = formData[addon.name] || {}
    oval.productionVersion = e.value
    setFormData({ ...formData, [addon.name]: oval })
  }

  const onStagingChange = (e) => {
    const oval = formData[addon.name] || {}
    oval.stagingVersion = e.value
    setFormData({ ...formData, [addon.name]: oval })
  }

  return (
    <section className="row" style={{ width: 800 }}>
      <span>{addon.name}</span>
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
    </section>
  )
}

const AddonsSettings = () => {
  const [data, setData] = useState(null)
  const [formData, setFormData] = useState({})

  const load = () => {
    axios.get('/api/addons').then((res) => setData(res.data.addons))
  }

  const submit = () => {
    axios
      .post('/api/addons', { versions: formData })
      .then(() => {
        toast.success('Addons updated')
        load()
      })
      .catch((err) => console.error(err))
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <main style={{ flexDirection: 'column' }}>
      <section className="invisible row">
        <Button label="Save" icon="check" onClick={submit} />
      </section>
      <section className="invisible">
        <Spacer>
          <section className="invisible">
            {data &&
              data.map((addon) => (
                <AddonListItem
                  key={addon.id}
                  addon={addon}
                  formData={formData}
                  setFormData={setFormData}
                />
              ))}
          </section>
        </Spacer>
      </section>
    </main>
  )
}

export default AddonsSettings
