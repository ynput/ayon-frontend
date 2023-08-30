import { useState, useMemo, useEffect } from 'react'
import { Dialog } from 'primereact/dialog'
import { toast } from 'react-toastify'

import { Spacer, InputText, Toolbar, SaveButton } from '@ynput/ayon-react-components'
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
  const [codeSet, setCodeSet] = useState(false)
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

  const [createProject, { isLoading }] = useCreateProjectMutation()

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

  const createCode = (name) => {
    if (name.length <= 4) return name.toLowerCase()
    let code = name.toLowerCase()
    if (name.includes('_')) {
      const subwords = name.split('_')
      code = subwords
        .map((subword) => subword.charAt(0))
        .join('')
        .slice(0, 4)
    } else {
      const vowels = ['a', 'e', 'i', 'o', 'u']
      const filteredWord = name
        .split('')
        .filter((char) => !vowels.includes(char))
        .join('')
      code = filteredWord.slice(0, 4)
    }

    // if there is a number at the end of the name, add it to the code
    const lastChar = name.charAt(name.length - 1)
    if (!isNaN(lastChar)) {
      code += lastChar
    }

    return code
  }

  const handleNameChange = (e) => {
    // replace spaces with underscores
    const name = e.target.value.replace(/\s/g, '_')
    setName(name)
    if (!codeSet || code === '') {
      const code = createCode(name)

      setCode(code)
    }
  }

  const handleCodeChange = (e) => {
    setCode(e.target.value)
    setCodeSet(true)
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
      <SaveButton
        label="Create Project"
        onClick={handleSubmit}
        active={name && code}
        saving={isLoading}
      />
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
            onChange={handleNameChange}
            autoFocus
          />
          <InputText placeholder="Project code" value={code} onChange={handleCodeChange} />
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
