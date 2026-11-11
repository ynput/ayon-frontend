import { useState, useMemo, useEffect, useRef } from 'react'
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
import {
  getCreateAnotherTooltip,
  getDialogKeyDown,
  getRequestErrorString,
  readDialogMemory,
  writeDialogMemory,
} from '@shared/util'
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

// the preset and state of the last project, kept for the session (not the library flag: most
// projects are not libraries, so carrying it over would make one by mistake)
const PROJECT_MEMORY = 'new-project'

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
  const [remembered] = useState(() => readDialogMemory(PROJECT_MEMORY))
  const namesRef = useRef(null)
  const anatomyRef = useRef(null)
  const [label, setLabel] = useState('')
  // counts projects made with the dialog kept open, to start the label and name field over for each
  const [createdCount, setCreatedCount] = useState(0)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [codeSet, setCodeSet] = useState(false)
  const [errors, setErrors] = useState({})
  const [formData, setFormData] = useState(null)
  const [selectedPreset, setSelectedPreset] = useState(remembered.selectedPreset || null)
  const [isLibrary, setIsLibrary] = useState(false)
  const [projectState, setProjectState] = useState(
    PROJECT_STATES.some((s) => s.value === remembered.projectState)
      ? remembered.projectState
      : 'production',
  )
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

  // name and code are passed in when Enter in the name field submits the name it just committed
  const validate = ({ name, code }) => {
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

  // keepOpen (Shift+Enter): create it and keep the dialog open for the next project
  const handleSubmit = (keepOpen = false, draft = { name, code }) => {
    if (!validate(draft)) return
    const { name: projectName, code: projectCode } = draft

    deployProject({
      deployProjectRequestModel: {
        name: projectName,
        label,
        code: projectCode,
        anatomy: isPlanningProject ? undefined : formData,
        library: isLibrary,
        skeleton: isPlanningProject,
      },
    })
      .unwrap()
      .then(() => {
        toast.success(`Project ${label} created`)
        writeDialogMemory(PROJECT_MEMORY, { selectedPreset, projectState })
        if (!keepOpen) return onHide(redirect ? projectName : undefined)
        setLabel('')
        setName('')
        setCode('')
        setCodeSet(false)
        setErrors({})
        // forget a name typed by hand, so the next name is generated from its label again
        setCreatedCount((count) => count + 1)
        namesRef.current?.querySelector('input')?.focus()
      })
      .catch((error) => {
        toast.error(`Unable to create project: ${getRequestErrorString(error)}`)
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

  // the name and the code that goes with it
  const resolveNameAndCode = (newName) => {
    // replace spaces with underscores
    const nextName = newName.replace(/\s/g, '_')
    return {
      name: nextName,
      code: !codeSet || code === '' ? createCode(nextName, codeRegex) : code,
    }
  }

  const handleNameChange = (newName) => {
    const next = resolveNameAndCode(newName)
    setName(next.name)
    setCode(next.code)
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

  const getCanSubmit = (draft) =>
    label &&
    draft.name &&
    draft.code &&
    (isPlanningProject || (!isOriginalAnatomyLoading && !isSchemaLoading))
  const canSubmit = getCanSubmit({ name, code })

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
        onClick={() => handleSubmit()}
        active={canSubmit}
        saving={isLoading}
        {...getCreateAnotherTooltip()}
      />
    </Toolbar>
  )

  const getKeyDown = (draft = { name, code }) =>
    getDialogKeyDown(() => handleSubmit(false, draft), {
      onClose: () => onHide(),
      disabled: !getCanSubmit(draft) || isLoading,
      onContinue: () => handleSubmit(true, draft),
    })
  const handleKeyDown = (e) => {
    e.stopPropagation()
    // Enter in the anatomy editor confirms that field, not the whole project
    if (e.key === 'Enter' && anatomyRef.current?.contains(e.target)) return
    getKeyDown()(e)
  }
  // Enter in the name editor commits the name and, like any other field, creates the project with it
  const handleNameEnter = (committedName, e) => getKeyDown(resolveNameAndCode(committedName))(e)

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
          <div ref={namesRef} style={{ flex: '1 1 320px', minWidth: 0 }}>
            <LabelWithNameField
              key={createdCount}
              labelValue={label}
              onLabelChange={setLabel}
              labelError={errors.label}
              labelLabel="Project label"
              nameValue={name}
              onNameChange={handleNameChange}
              onNameEnter={handleNameEnter}
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
          <AnatomySection ref={anatomyRef}>
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
