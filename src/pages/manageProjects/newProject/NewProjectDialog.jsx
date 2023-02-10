import { useState, useMemo } from 'react'
import { Dialog } from 'primereact/dialog'
import { toast } from 'react-toastify'

import axios from 'axios'
import { Button, Spacer, InputText, Toolbar } from '@ynput/ayon-react-components'
import SettingsEditor from '/src/containers/settingsEditor'
import PresetDropdown from './PresentDropdown'
import { useGetAnatomyPresetsQuery, useGetAnatomySchemaQuery } from '/src/services/getAnatomy'

const NewProjectDialog = ({ onHide }) => {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [newAnatomy, setNewAnatomy] = useState(null)
  const [selectedPreset, setSelectedPreset] = useState(null)

  // GET SCHEMA DATA
  // '/api/anatomy/schema'
  const { data: schema, isLoading: isSchemaLoading } = useGetAnatomySchemaQuery()

  // GET PRESET DATA
  // `/api/anatomy/presets/${selectedPreset}`
  const { data: originalAnatomy, isLoading: isOriginalAnatomyLoading } = useGetAnatomyPresetsQuery(
    { preset: selectedPreset },
    { skip: !selectedPreset },
  )

  // Logic
  //

  const handleSubmit = () => {
    axios
      .post('/api/projects', {
        name,
        code,
        anatomy: newAnatomy || originalAnatomy,
      })
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

  const editor = useMemo(() => {
    if (isSchemaLoading || isOriginalAnatomyLoading) return 'Loading editor...'
    return <SettingsEditor schema={schema} formData={originalAnatomy} onChange={setNewAnatomy} />
  }, [schema, originalAnatomy])

  const footer = (
    <div style={{}}>
      <Spacer />
      <Button icon="add" label="Create" onClick={handleSubmit} />
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
          gap: 8,
        }}
      >
        <Toolbar>
          <InputText
            placeholder="Project Name"
            style={{ flexGrow: 1 }}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <InputText
            placeholder="Project code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <PresetDropdown
            selectedPreset={selectedPreset}
            setSelectedPreset={setSelectedPreset}
            tooltip="Project anatomy preset"
          />
        </Toolbar>
        {editor}
      </div>
    </Dialog>
  )
}

export default NewProjectDialog
