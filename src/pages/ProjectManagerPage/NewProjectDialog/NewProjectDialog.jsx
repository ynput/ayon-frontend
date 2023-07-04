import { useState, useMemo, useEffect } from 'react'
import { Dialog } from 'primereact/dialog'
import { toast } from 'react-toastify'

import { Button, Spacer, InputText, Toolbar } from '@ynput/ayon-react-components'
import SettingsEditor from '/src/containers/SettingsEditor'
import AnatomyPresetDropdown from './AnatomyPresetDropdown'
import {
  useGetAnatomyPresetQuery,
  useGetAnatomySchemaQuery,
} from '../../../services/anatomy/getAnatomy'
import { useCreateProjectMutation } from '/src/services/project/updateProject'

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
  const { data: originalAnatomy, isLoading: isOriginalAnatomyLoading } = useGetAnatomyPresetQuery(
    { preset: selectedPreset },
    { skip: !selectedPreset },
  )

  // Logic
  //

  const [createProject] = useCreateProjectMutation()

  const handleSubmit = () => {
    createProject({
      name,
      code,
      anatomy: newAnatomy, // || originalAnatomy,
    })
      .unwrap()
      .then(() => {
        toast.success('Project created')
        onHide(name)
      })
      .catch((error) => {
        // log
        toast.error(`Unable to create project ${error}`)
      })
  }

  //
  // Render
  //

  useEffect(() => {
    setNewAnatomy(originalAnatomy)
  }, [originalAnatomy])

  const editor = useMemo(() => {
    if (isSchemaLoading || isOriginalAnatomyLoading) return 'Loading editor...'
    return <SettingsEditor schema={schema} formData={originalAnatomy} onChange={setNewAnatomy} />
  }, [schema, originalAnatomy])

  const footer = (
    <Toolbar style={{}}>
      <Spacer />
      <Button icon="add" label="Create Project" onClick={handleSubmit} />
    </Toolbar>
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
          <AnatomyPresetDropdown
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
