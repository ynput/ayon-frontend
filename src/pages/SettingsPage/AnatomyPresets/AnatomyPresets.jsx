import { useEffect, useState, useMemo, useRef } from 'react'

import copyToClipboard from '/src/helpers/copyToClipboard'
import pasteFromClipboard from '/src/helpers/pasteFromClipboard'

import { Dialog } from 'primereact/dialog'
import { InputText } from 'primereact/inputtext'

import { toast } from 'react-toastify'

import {
  Spacer,
  Button,
  Section,
  Toolbar,
  ScrollPanel,
  SaveButton,
} from '@ynput/ayon-react-components'

import { useGetAnatomyPresetsQuery } from '/src/services/anatomy/getAnatomy'
import PresetList from './PresetList'
import AnatomyEditor from '/src/containers/AnatomyEditor'
import {
  useDeletePresetMutation,
  useUpdatePresetMutation,
  useUpdatePrimaryPresetMutation,
} from '/src/services/anatomy/updateAnatomy'
import confirmDelete from '/src/helpers/confirmDelete'

const AnatomyPresets = () => {
  const [formData, setFormData] = useState(null)
  const [selectedPreset, setSelectedPreset] = useState('_')
  const [showNameDialog, setShowNameDialog] = useState(false)
  const [newPresetName, setNewPresetName] = useState('')
  const [breadcrumbs, setBreadcrumbs] = useState([])
  const [isChanged, setIsChanged] = useState(false)

  const nameInputRef = useRef(null)

  //
  // Hooks
  //

  // get presets lists data
  const { data: presetList = [], isLoading } = useGetAnatomyPresetsQuery()

  useEffect(() => {
    // preselect primary preset if there is one
    // otherwise select default preset
    const primaryPreset = presetList.find((p) => p.primary === 'PRIMARY')
    if (primaryPreset) {
      setSelectedPreset(primaryPreset.name)
    } else {
      setSelectedPreset('_')
    }
  }, [presetList])

  const isSelectedPrimary = useMemo(() => {
    // find preset in list
    const preset = presetList.find((p) => p.name === selectedPreset)
    return preset && preset.primary === 'PRIMARY'
  }, [selectedPreset, presetList])

  useEffect(() => {
    // focus input when dialog is shown
    if (showNameDialog && nameInputRef.current) {
      setTimeout(() => {
        nameInputRef.current.focus()
      }, 100)
    }
  }, [showNameDialog, nameInputRef])

  //
  // Actions
  //

  // RTK Query updateAnatomy.js mutations
  const [updatePreset, { isLoading: isUpdating }] = useUpdatePresetMutation()
  const [deletePreset] = useDeletePresetMutation()
  const [updatePrimaryPreset] = useUpdatePrimaryPresetMutation()

  // SAVE PRESET
  const savePreset = (name) => {
    updatePreset({ name, data: formData })
      .unwrap()
      .then(() => {
        setSelectedPreset(name)
        setShowNameDialog(false)
        toast.info(`Preset ${name} saved`)
      })
      .catch((err) => {
        toast.error(err.message)
      })
  }

  // DELETE PRESET
  const handleDeletePreset = (name, isPrimary) => {
    console.log('handleDeletePreset')
    confirmDelete({
      label: `Preset: ${name}`,
      accept: async () => {
        await deletePreset({ name }).unwrap()
        if (isPrimary) {
          setSelectedPreset('_')
        }
      },
    })
  }

  // SET PRIMARY PRESET
  const setPrimaryPreset = (name = '_') => {
    // if name is not provided, set primary preset to "_"
    // this is used to unset the primary preset

    updatePrimaryPreset({ name })
      .unwrap()
      .then(() => {
        if (name) {
          toast.info(`Preset ${name} set as primary`)
        } else {
          toast.info(`Unset primary preset`)
        }
      })
      .catch((err) => {
        toast.error(err.message)
      })
  }

  useEffect(() => {
    console.log('Bread', breadcrumbs)
  }, [breadcrumbs])

  //
  // Render
  //

  return (
    <main>
      {showNameDialog && (
        <Dialog
          header="Preset name"
          visible="true"
          onHide={() => setShowNameDialog(false)}
          style={{ minWidth: 300 }}
          footer={
            <SaveButton
              label="Create New Preset"
              onClick={() => savePreset(newPresetName)}
              active={newPresetName}
              style={{ marginLeft: 'auto' }}
            />
          }
        >
          <InputText
            value={newPresetName}
            ref={nameInputRef}
            onChange={(e) => setNewPresetName(e.target.value)}
            placeholder="Preset name"
            style={{
              width: '100%',
            }}
          />
        </Dialog>
      )}

      <Section style={{ maxWidth: 600 }}>
        <PresetList
          selectedPreset={selectedPreset}
          setSelectedPreset={setSelectedPreset}
          onSetPrimary={setPrimaryPreset}
          onDelete={handleDeletePreset}
          isLoading={isLoading}
          presetList={presetList}
        />
      </Section>

      <Section>
        <Toolbar>
          <Button
            label="Copy anatomy"
            icon="content_copy"
            onClick={() => {
              copyToClipboard(JSON.stringify(formData, null, 2))
            }}
          />
          <Button
            label="Paste anatomy"
            icon="content_paste"
            onClick={async () => {
              const content = await pasteFromClipboard()
              if (!content) {
                toast.error('Clipboard is empty')
                return
              }
              try {
                const data = JSON.parse(content)
                setFormData(data)
                setIsChanged(true)
                toast.info('Anatomy pasted')
              } catch (err) {
                console.log(err)
                toast.error('Clipboard content is not valid JSON')
              }
            }}
          />

          <Spacer />
          <Button
            label="Set as primary"
            icon="flag"
            onClick={() => setPrimaryPreset(selectedPreset)}
          />
          <Button
            label="Delete preset"
            icon="delete"
            disabled={selectedPreset === '_'}
            onClick={() => handleDeletePreset(selectedPreset, isSelectedPrimary)}
            style={{ display: selectedPreset === '_' ? 'none' : 'flex' }}
          />
          <Button
            label="Save as a new preset"
            icon="add"
            onClick={() => {
              setNewPresetName('')
              setShowNameDialog(true)
            }}
            variant={selectedPreset === '_' ? 'filled' : 'surface'}
          />

          <SaveButton
            label="Save Current Preset"
            saving={isUpdating}
            active={isChanged && selectedPreset !== '_'}
            onClick={() => savePreset(selectedPreset)}
            variant={selectedPreset === '_' ? 'surface' : 'filled'}
          />
        </Toolbar>

        <ScrollPanel style={{ flexGrow: 1 }} className="transparent">
          <AnatomyEditor
            formData={formData}
            setFormData={setFormData}
            preset={selectedPreset}
            breadcrumbs={breadcrumbs}
            setBreadcrumbs={setBreadcrumbs}
            setIsChanged={setIsChanged}
          />
        </ScrollPanel>
      </Section>
    </main>
  )
}

export default AnatomyPresets
