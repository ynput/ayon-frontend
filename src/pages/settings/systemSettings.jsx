import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Panel } from 'primereact/panel'
import { ToggleButton } from 'primereact/togglebutton'

import { Button, Spacer } from '../../components'
import SettingsEditor from '../../containers/settingsEditor'


const AddonsPanel = ({staging, selectedAddons, onSelect}) => {
  const [addons, setAddons] = useState(null)

  useEffect(() => {
    axios.get('/api/addons').then(res => {
      let result = []
      for (const addon of res.data.addons) {
        const row = {
          name: addon.name,
          title: addon.title,
        }
        if (staging) {
          if (!addon.stagingVersion)
            continue
          row.version = addon.stagingVersion
        } else {
          if (!addon.productionVersion)
            continue
          row.version = addon.productionVersion
        }
        result.push(row)
      }
      setAddons(result)
    })
  }, [staging])

  const onSelectionChange = (e) => {
    const selected = e.value
    onSelect(selected)
  }

  return (
    <section style={{ width: 400, height: '100%'}}>
      <div className="wrapper" >
        <DataTable
          value={addons}
          selectionMode="multiple"
          selection={selectedAddons}
          onSelectionChange={onSelectionChange}
        >
          <Column field="name" header="Name" />
          <Column field="version" header="Version" />
        </DataTable>
      </div>
    </section>
  )
}

const SettingsPanel = ({addon, staging, onClose}) => {
  const [schema, setSchema] = useState(null)
  const [originalData, setOriginalData] = useState(null)
  const [overrides, setOverrides] = useState(null)
  const [newData, setNewData] = useState(null)

  const loadSchema = () => {
    const params = {}
    if (staging)
      params.staging = addon.stagingVersion
    axios
      .get(`/api/addons/${addon.name}/schema`, { params })
      .then((res) => setSchema(res.data))
      .catch((err) => console.log(err))
  }

  const loadSettings = () => {
    axios
      .get(`/api/addons/${addon.name}/settings`)
      .then((res) => {
        setOriginalData(res.data)
        setNewData(null)
      })
      .catch((err) => console.log(err))

    axios
      .get(`/api/addons/${addon.name}/overrides`)
      .then((res) => setOverrides(res.data))
  }

  useEffect(() => {
    loadSchema()
    loadSettings()
  }, [addon.name, staging])

  const onChange = (formData) => {
    //   console.log(formData)
    setNewData(formData)
  }

  const editor = useMemo(() => {
    if (!(schema && originalData && overrides)) return 'Loading editor..'
    return (
      <SettingsEditor
        schema={schema}
        formData={originalData}
        overrides={overrides}
        onChange={onChange}
        onSetBreadcrumbs={() => {}}
      />
    )
  }, [schema, originalData, overrides])

  return (
  <div style={{ flexGrow:0}}>
    {editor}
  </div>
  )
}



const SystemSettings = () => {
  const [staging, setStaging] = useState(false)
  const [selectedAddons, setSelectedAddons] = useState([])


  return (
    <main>
      <section className="invisible" style={{ flexGrow: 1 }}>
        <section className="invisible row">
          <ToggleButton
            checked={staging}
            onChange={e => setStaging(e.value)}
            onLabel="Staging"
            offLabel="Production"
          />
        </section>
        <section className="invisible row" style={{ flexGrow: 1}}>
          <AddonsPanel 
            staging={staging} 
            selectedAddons={selectedAddons}
            onSelect={setSelectedAddons}
          />
          <section className="invisible" style={{ flexGrow: 1, height: "100%"}}>
            <div className="wrapper" style={{ display: "flex", flexDirection: "column", overflowY: "scroll", gap: 12 }}>

              {selectedAddons.map(addon => (
                <Panel key={addon.name} style={{ flexGrow: 0 }}>
                  <SettingsPanel addon={addon} staging={staging} />
                </Panel>
              ))}

            <Spacer/>
            </div>
          </section>
          
        </section>
      </section>
    </main>
  )
}

export default SystemSettings
