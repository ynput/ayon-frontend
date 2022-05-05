import { useEffect, useState } from 'react'
import { Dialog } from 'primereact/dialog'
import { InputText } from 'primereact/inputtext'
import { Button } from 'primereact/button'
import { Dropdown } from 'primereact/dropdown'
import axios from 'axios'
import AnatomyEditor from '../../containers/anatomyEditor'
import { loadAnatomyPresets } from '../../utils'


const PresetDropdown = ({selectedPreset, setSelectedPreset}) => {
  const [presetList, setPresetList] = useState([])

  useEffect(() => {
    loadAnatomyPresets().then((r) => {
      setPresetList(r)
      if (!selectedPreset) {
        setSelectedPreset(r[0].name)
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Dropdown
      value={selectedPreset}
      onChange={(e) => setSelectedPreset(e.value)}
      options={presetList}
      optionValue="name"
      optionLabel="title"
      tooltip="Preset"
      tooltipOptions={{ position: 'bottom' }}
      style={{ minWidth: 200 }}
    />
  )
}


const NewProjectDialog = ({ onHide }) => {
  const [schema, setSchema] = useState(null)
  const [formData, setFormData] = useState(null)
  const [selectedPreset, setSelectedPreset] = useState(null)

  useEffect(() => {
    axios
      .get('/api/anatomy/schema')
      .then((res) => setSchema(res.data))
  }, [])

  useEffect(() => {
    axios
      .get(`/api/anatomy/presets/${selectedPreset}`)
      .then((res) => setFormData(res.data))
  }, [selectedPreset])

  //
  // Render
  //

  const footer = (
    <div
      style={{
      }}
    >
      <Button
        icon="pi pi-plus"
        label="Create"
        className="p-button-info"
        onClick={onHide}
        style={{ width: 120, marginTop: 15 }}
      />
    </div>
  )

  return (
    <Dialog
      header="Create a new project"
      footer={footer}
      visible="true"
      onHide={onHide}
      style={{
        width: '50vw',
        height: '80%',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: 8,
            marginBottom: 8,
          }}
        >
          <InputText placeholder="Project Name" style={{ width: '100%' }} />
          <PresetDropdown selectedPreset={selectedPreset} setSelectedPreset={setSelectedPreset}/>
        </div>
        <AnatomyEditor
          schema={schema}
          formData={formData}
          onChange={setFormData}
        />
      </div>
    </Dialog>
  )
}

export default NewProjectDialog
