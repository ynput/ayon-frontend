import { useState, useMemo, useEffect } from 'react'
import { Dialog } from '@ynput/ayon-react-components'
import { toast } from 'react-toastify'

import { Spacer, InputText, Toolbar, SaveButton, InputSwitch } from '@ynput/ayon-react-components'
import SettingsEditor from '@containers/SettingsEditor'
import AnatomyPresetDropdown from './AnatomyPresetDropdown'
import { useGetAnatomyPresetQuery, useGetAnatomySchemaQuery } from '@queries/anatomy/getAnatomy'
import { useDeployProjectMutation } from '@shared/api'
import { useGetConfigValueQuery } from '@shared/api'
import { camelCase } from 'lodash'

// allow only alphanumeric and underscorer,
// while underscore cannot be the first or last character
const PROJECT_NAME_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9_]*[a-zA-Z0-9]$/
const PROJECT_CODE_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9_]*[a-zA-Z0-9]$/

const NewProjectDialog = ({ onHide }) => {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [codeSet, setCodeSet] = useState(false)
  const [formData, setFormData] = useState(null)
  const [selectedPreset, setSelectedPreset] = useState(null)
  const [isLibrary, setIsLibrary] = useState(false)

  // GET SCHEMA DATA
  // '/api/anatomy/schema'
  const { data: schema, isLoading: isSchemaLoading } = useGetAnatomySchemaQuery()

  // GET PRESET DATA
  // `/api/anatomy/presets/${selectedPreset}`
  const { data: originalAnatomy, isLoading: isOriginalAnatomyLoading } = useGetAnatomyPresetQuery(
    { preset: selectedPreset },
    { skip: !selectedPreset },
  )

  // Code regex from server config
  const { data: projectOptions } = useGetConfigValueQuery({ key: 'project_options' })
  const { project_code_regex: codeRegex } = projectOptions || {}

  // Logic
  //
  const [deployProject, { isLoading }] = useDeployProjectMutation()

  const handleSubmit = () => {
    deployProject({
      deployProjectRequestModel: {
        name,
        code,
        anatomy: formData,
        library: isLibrary,
      },
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

  const createCode = (name, regexPattern) => {
    if (!regexPattern) return ''

    // Always create a new RegExp from the string pattern
    try {
      // Add 'g' flag to match all occurrences
      const regex = new RegExp(regexPattern, 'g')

      // Use matchAll instead of match for global patterns
      const matches = [...name.replaceAll('_', ' ').matchAll(regex)]
      if (!matches.length) return ''

      // Check if the regex has capture groups
      if (matches[0].length > 1) {
        // Extract the first capture group from each match
        return matches
          .map((match) => match[1])
          .join('')
          .replaceAll(' ', '')
      } else {
        // If no capture groups, use the full match
        return matches
          .map((match) => match[0])
          .join('')
          .replaceAll(' ', '')
      }
    } catch (error) {
      console.warn('Invalid regex pattern for project code', error)
      return ''
    }
  }

  const handleNameChange = (e) => {
    // replace spaces with underscores
    const name = e.target.value.replace(/\s/g, '_')
    setName(name)
    if (!codeSet || code === '') {
      const newCode = createCode(name, codeRegex)
      setCode(newCode)
    }
  }

  const handleCodeChange = (e) => {
    setCode(e.target.value)
    setCodeSet(true)
  }

  const nameValidationError = useMemo(() => {
    if (!name) return 'Project name is required'
    if (name.length < 3) return 'Project name must be at least 3 characters'
    if (!PROJECT_NAME_REGEX.test(name)) {
      return 'Project name can only contain alphanumeric characters and underscores'
    }
    return null
  }, [name])

  const codeValidationError = useMemo(() => {
    if (!code) return 'Project code is required'
    if (code.length > 10) return 'Project code is too long'
    if (!PROJECT_CODE_REGEX.test(code)) {
      return 'Project code can only contain alphanumeric characters and underscores'
    }
    return null
  }, [code])

  //
  // Render
  //

  useEffect(() => {
    setFormData(originalAnatomy)
  }, [originalAnatomy])

  const footer = (
    <Toolbar style={{}}>
      Library project
      <InputSwitch
        checked={isLibrary}
        onChange={(e) => setIsLibrary(e.target.checked)}
        style={{ marginLeft: 8 }}
      />
      <Spacer />
      <SaveButton
        label="Create Project"
        onClick={handleSubmit}
        active={name && code && !isOriginalAnatomyLoading && !isSchemaLoading}
        saving={isLoading}
        disabled={!!(nameValidationError || codeValidationError)}
      />
    </Toolbar>
  )

  const handleKeyDown = (e) => {
    e?.stopPropagation()
    const enter = e.key === 'Enter'
    const ctrlMeta = e.ctrlKey || e.metakey
    const shift = e.shiftKey
    const esc = e.key === 'Escape'
    const isSubmitEnabeld = !(nameValidationError || codeValidationError)

    if (isSubmitEnabeld && enter && ctrlMeta) handleSubmit()
    if (isSubmitEnabeld && enter && shift) handleSubmit()
    if (esc) onHide()
  }

  const anatomyEditor = useMemo(() => {
    if (isSchemaLoading || isOriginalAnatomyLoading || !formData) {
      return 'Loading editor...'
    }
    return <SettingsEditor schema={schema} formData={formData} onChange={setFormData} />
  }, [isSchemaLoading, isOriginalAnatomyLoading, formData, schema, setFormData])

  return (
    <Dialog
      header="Create a new project"
      footer={footer}
      isOpen={true}
      onClose={() => onHide()}
      size="full"
      style={{ height: '80%', maxHeight: 1000, zIndex: 999, maxWidth: 2000 }}
      onKeyDown={handleKeyDown}
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
            title={nameValidationError}
            className={nameValidationError ? 'error' : ''}
            autoFocus
          />
          <InputText
            placeholder="Project code"
            value={code}
            onChange={handleCodeChange}
            title={codeValidationError}
            className={codeValidationError ? 'error' : ''}
            data-tooltip={'Regex: ' + codeRegex}
          />
          <AnatomyPresetDropdown
            selectedPreset={selectedPreset}
            setSelectedPreset={setSelectedPreset}
            tooltip="Project anatomy preset"
          />
        </Toolbar>
        {anatomyEditor}
      </div>
    </Dialog>
  )
}

export default NewProjectDialog
