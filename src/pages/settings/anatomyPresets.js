import { useEffect, useState } from 'react'
import axios from 'axios'

import AnatomyEditor from '../../containers/anatomyEditor'
import { Button } from 'primereact/button'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'

const defaultPreset = { name: '_', title: '<default (built-in)>' }

const PresetList = ({ selectedPreset, setSelectedPreset }) => {
  const [presetList, setPresetList] = useState([])

  useEffect(() => {
    axios.get('/api/anatomy/presets').then((res) => {
      let primaryPreset = defaultPreset

      let presets = []
      for (const tpl in res.data.presets) {
        if (tpl.primary)
          primaryPreset = { name: tpl.name, title: `<default (${tpl.name})>` }

        presets.push({ name: tpl.name, title: tpl.title })
      }

      setPresetList([primaryPreset, ...presets])
    })
  }, [])

  return (
    <div className="wrapper">
      <DataTable
        value={presetList}
        scrollable
        scrollHeight="flex"
        selectionMode="single"
        responsive="true"
        dataKey="name"
        selection={{ name: selectedPreset }}
        onSelectionChange={(e) => setSelectedPreset(e.value.name)}
      >
        <Column field="title" header="Name" />
      </DataTable>
    </div>
  )
}

const AnatomyPresets = () => {
  const [schema, setSchema] = useState(null)
  const [formData, setFormData] = useState(null)
  const [selectedPreset, setSelectedPreset] = useState('_')

  useEffect(() => {
    axios.get('/api/anatomy/schema').then((res) => {
      setSchema(res.data)
    })
  }, [])

  useEffect(() => {
    axios.get('/api/anatomy/templates/_').then((res) => {
      console.log(res.data)
      setFormData(res.data)
    })
  }, [])

  return (
    <main>
      <section className="lighter" style={{ flexBasis: '600px', padding: 0 }}>
        <PresetList
          selectedTemplate={selectedPreset}
          setSelectedTemplate={setSelectedPreset}
        />
      </section>

      <section style={{ flexGrow: 1 }} className="invisible">
        <section className="invisible row">
          <Button label="Save current preset" icon="pi pi-plus" />
          <Button label="Save as a new preset" icon="pi pi-plus" />
          <Button label="Delete the preset" icon="pi pi-times" />
          <Button label="Set as default preset" icon="pi pi-times" />
          <div style={{ flexGrow: 1 }} />
        </section>

        <section style={{ flexGrow: 1 }}>
          <div className="wrapper" style={{ overflowY: 'scroll' }}>
            <AnatomyEditor
              schema={schema}
              formData={formData}
              onChange={setFormData}
            />
          </div>
        </section>
      </section>
    </main>
  )
}

export default AnatomyPresets
