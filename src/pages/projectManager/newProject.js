import { useEffect, useState } from 'react'
import { Dialog } from 'primereact/dialog'
import { InputText } from 'primereact/inputtext'
import { Button } from 'primereact/button'
import { Dropdown } from 'primereact/dropdown'
import { toast } from 'react-toastify'
import axios from 'axios'
import AnatomyEditor from '../../containers/anatomyEditor'
import { loadAnatomyPresets } from '../../utils'

const PresetDropdown = ({ selectedPreset, setSelectedPreset }) => {
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
  const [name, setName] = useState('')
  const [anatomy, setAnatomy] = useState(null)
  const [selectedPreset, setSelectedPreset] = useState(null)

  useEffect(() => {
    axios.get('/api/anatomy/schema').then((res) => setSchema(res.data))
  }, [])

  useEffect(() => {
    if (!selectedPreset) return
    axios
      .get(`/api/anatomy/presets/${selectedPreset}`)
      .then((res) => setAnatomy(res.data))
  }, [selectedPreset])

  // Logic
  //

  const handleSubmit = () => {
    axios
      .post('/api/projects', { name, anatomy })
      .then(() => {
        toast.success('Project created')
        onHide()
      })
      .catch((error) => {
        toast.error(`Unable to create project ${error.response.data.detail}`)
      })
  }

  //
  // Render
  //

  const footer = (
    <div style={{}}>
      <Button
        icon="pi pi-plus"
        label="Create"
        className="p-button-info"
        onClick={handleSubmit}
        style={{ width: 120 }}
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
          <InputText
            placeholder="Project Name"
            style={{ width: '100%' }}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <PresetDropdown
            selectedPreset={selectedPreset}
            setSelectedPreset={setSelectedPreset}
            tooltip="Project anatomy preset"
          />
        </div>
        <AnatomyEditor
          schema={schema}
          formData={anatomy}
          onChange={setAnatomy}
        />
      </div>
    </Dialog>
  )
}

export default NewProjectDialog
