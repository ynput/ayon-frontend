import { useState, useMemo, useEffect } from 'react'
import { Dialog } from '@ynput/ayon-react-components'
import { toast } from 'react-toastify'
import styled from 'styled-components'

import {
  Spacer,
  InputText,
  Toolbar,
  SaveButton,
  InputSwitch,
  Dropdown,
} from '@ynput/ayon-react-components'
import SettingsEditor from '@containers/SettingsEditor'
import AnatomyPresetDropdown from './AnatomyPresetDropdown'
import { LabelWithNameField } from '@components/LabelWithNameField'
import { useGetAnatomyPresetQuery, useGetAnatomySchemaQuery } from '@queries/anatomy/getAnatomy'
import { useDeployProjectMutation } from '@shared/api'
import { useGetConfigValueQuery } from '@shared/api'
import { camelCase } from 'lodash'

// allow only alphanumeric and underscorer,
// while underscore cannot be the first or last character
const PROJECT_NAME_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9_]*[a-zA-Z0-9]$/
const PROJECT_CODE_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9_]*[a-zA-Z0-9]$/
const PROJECT_STATES = [
  { value: 'planning', label: 'Planning' },
  { value: 'production', label: 'Production' },
]

// prefer unicode mode for \p{...} patterns, but some patterns legal without it (e.g. `\-` outside a class) only compile as non-unicode
const buildCodeRegex = (pattern) => {
  try {
    return new RegExp(pattern, 'gu')
  } catch (error) {
    return new RegExp(pattern, 'g')
  }
}

const matchProjectCode = (value, pattern) => {
  const matches = [...value.matchAll(buildCodeRegex(pattern))]
  if (!matches.length) return ''

  return matches
    .map((match) => (match.length > 1 ? match.slice(1).filter(Boolean).join('') : match[0]))
    .join('')
    .replaceAll(' ', '')
    .replace(/^_+|_+$/g, '')
}

const DialogContent = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const FormRow = styled.div`
  display: flex;
  gap: 16px;
  align-items: flex-end;
  flex-wrap: wrap;
`

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
`

const FieldLabel = styled.label`
  display: block;
  font-size: 12px;
  font-weight: 600;
`

const AnatomySection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  flex: 1;
`

const AnatomyEditorSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 0;
  flex: 1;
`

const NewProjectDialog = ({ onHide, redirect = true }) => {
  const [label, setLabel] = useState('')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [codeSet, setCodeSet] = useState(false)
  const [errors, setErrors] = useState({})
  const [formData, setFormData] = useState(null)
  const [selectedPreset, setSelectedPreset] = useState(null)
  const [isLibrary, setIsLibrary] = useState(false)
  const [projectState, setProjectState] = useState('production')
  const isPlanningProject = projectState === 'planning'
  const isProductionProject = projectState === 'production'

  // GET SCHEMA DATA
  // '/api/anatomy/schema'
  const { data: schema, isLoading: isSchemaLoading } = useGetAnatomySchemaQuery(undefined, {
    skip: isPlanningProject,
  })

  // GET PRESET DATA
  // `/api/anatomy/presets/${selectedPreset}`
  const { data: originalAnatomy, isLoading: isOriginalAnatomyLoading } = useGetAnatomyPresetQuery(
    { preset: selectedPreset },
    { skip: isPlanningProject || !selectedPreset },
  )

  // Code regex from server config
  const { data: projectOptions } = useGetConfigValueQuery({ key: 'project_options' })
  const { project_code_regex: codeRegex } = projectOptions || {}

  // Logic
  //
  const [deployProject, { isLoading }] = useDeployProjectMutation()

  const validate = () => {
    const newErrors = {}
    if (!name) newErrors.name = 'Project name is required'
    else if (name.length < 3) newErrors.name = 'Project name must be at least 3 characters'
    else if (!PROJECT_NAME_REGEX.test(name)) {
      newErrors.name = 'Project name can only contain alphanumeric characters and underscores'
    }

    if (!label.trim()) newErrors.label = 'Project label is required'

    if (!code) newErrors.code = 'Project code is required'
    else if (code.length > 10) newErrors.code = 'Project code is too long'
    else if (!PROJECT_CODE_REGEX.test(code)) {
      newErrors.code = 'Project code can only contain alphanumeric characters and underscores'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return

    deployProject({
      deployProjectRequestModel: {
        name,
        label,
        code,
        anatomy: isPlanningProject ? undefined : formData,
        library: isLibrary,
        skeleton: isPlanningProject,
      },
    })
      .unwrap()
      .then(() => {
        toast.success('Project created')
        onHide(redirect ? name : undefined)
      })
      .catch((error) => {
        // log
        toast.error(`Unable to create project ${error}`)
      })
  }

  const createCode = (name, regexPattern) => {
    if (!regexPattern || !name) return ''

    try {
      const rawCode = matchProjectCode(name, regexPattern)
      if (PROJECT_CODE_REGEX.test(rawCode)) return rawCode

      // \b and \s never fire on snake_case names, so retry on a spaced name to keep pre-existing configs working
      const spacedCode = matchProjectCode(name.replaceAll('_', ' '), regexPattern)
      return PROJECT_CODE_REGEX.test(spacedCode) ? spacedCode : rawCode
    } catch (error) {
      console.warn('Invalid regex pattern for project code', error)
      return ''
    }
  }

  const createName = (labelValue) => {
    const sanitizedLabel = labelValue
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '')

    if (sanitizedLabel) return sanitizedLabel

    return camelCase(labelValue).replace(/[^a-zA-Z0-9_]/g, '')
  }

  const handleNameChange = (newName) => {
    // replace spaces with underscores
    const nextName = newName.replace(/\s/g, '_')
    setName(nextName)
    if (!codeSet || code === '') {
      const newCode = createCode(nextName, codeRegex)
      setCode(newCode)
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
    if (isPlanningProject) return
    setFormData(originalAnatomy)
  }, [isPlanningProject, originalAnatomy])

  const footer = (
    <Toolbar style={{}}>
      {isProductionProject && (
        <>
          Library project
          <InputSwitch
            checked={isLibrary}
            onChange={(e) => setIsLibrary(e.target.checked)}
            style={{ marginLeft: 8 }}
          />
        </>
      )}
      <Spacer />
      <SaveButton
        label="Create Project"
        onClick={handleSubmit}
        active={
          label &&
          name &&
          code &&
          (isPlanningProject || (!isOriginalAnatomyLoading && !isSchemaLoading))
        }
        saving={isLoading}
      />
    </Toolbar>
  )

  const handleKeyDown = (e) => {
    e?.stopPropagation()
    const enter = e.key === 'Enter'
    const ctrlMeta = e.ctrlKey || e.metakey
    const shift = e.shiftKey
    const esc = e.key === 'Escape'

    if (enter && (ctrlMeta || shift)) handleSubmit()
    if (esc) onHide()
  }

  const anatomyEditor = useMemo(() => {
    if (isPlanningProject) return null

    if (isSchemaLoading || isOriginalAnatomyLoading || !formData) {
      return 'Loading editor...'
    }
    return <SettingsEditor schema={schema} formData={formData} onChange={setFormData} />
  }, [isPlanningProject, isSchemaLoading, isOriginalAnatomyLoading, formData, schema, setFormData])

  return (
    <Dialog
      header="Create a new project"
      footer={footer}
      isOpen={true}
      onClose={() => onHide()}
      size={isProductionProject ? 'full' : 'md'}
      style={
        isProductionProject ? { height: '80%', maxHeight: 1000, zIndex: 999, maxWidth: 2000 } : {}
      }
      onKeyDown={handleKeyDown}
    >
      <DialogContent>
        <FormRow>
          <FieldGroup style={{ flex: '0 0 220px' }}>
            <FieldLabel>Project state</FieldLabel>
            <Dropdown
              options={PROJECT_STATES}
              value={[projectState]}
              onChange={(value) => setProjectState(value[0])}
              style={{ minWidth: 180 }}
              data-tooltip="Project state"
            />
          </FieldGroup>
        </FormRow>

        <FormRow style={{ alignItems: 'flex-start' }}>
          <div style={{ flex: '1 1 320px', minWidth: 0 }}>
            <LabelWithNameField
              labelValue={label}
              onLabelChange={setLabel}
              labelError={errors.label}
              labelLabel="Project label"
              nameValue={name}
              onNameChange={handleNameChange}
              nameError={errors.name}
              nameLabel="Project name"
              getGeneratedName={createName}
              autoFocus
              isSubmitting={isLoading}
            />
          </div>
          <FieldGroup style={{ flex: '0 0 220px' }}>
            <FieldLabel>Project code</FieldLabel>
            <InputText
              placeholder="Project code"
              value={code}
              onChange={handleCodeChange}
              title={errors.code}
              className={errors.code ? 'error' : ''}
              data-tooltip={'Regex: ' + codeRegex}
            />
          </FieldGroup>
        </FormRow>

        {!isPlanningProject && (
          <AnatomySection>
            <FieldGroup style={{ flex: '0 0 auto' }}>
              <FieldLabel>Project anatomy preset</FieldLabel>
              <AnatomyPresetDropdown
                selectedPreset={selectedPreset}
                setSelectedPreset={setSelectedPreset}
                tooltip="Project anatomy preset"
              />
            </FieldGroup>
            <AnatomyEditorSection>
              <FieldLabel>Project anatomy</FieldLabel>
              {anatomyEditor}
            </AnatomyEditorSection>
          </AnatomySection>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default NewProjectDialog
