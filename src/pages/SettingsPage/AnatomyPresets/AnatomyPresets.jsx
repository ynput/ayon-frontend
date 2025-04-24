import { useEffect, useState, useMemo, useRef } from 'react'

import copyToClipboard from '@helpers/copyToClipboard'
import { usePaste } from '@context/pasteContext'

import { InputText } from 'primereact/inputtext'

import { toast } from 'react-toastify'

import {
  Spacer,
  Button,
  Section,
  Toolbar,
  ScrollPanel,
  SaveButton,
  Dialog,
} from '@ynput/ayon-react-components'

import { useGetAnatomyPresetsQuery } from '@queries/anatomy/getAnatomy'
import PresetList from './PresetList'
import AnatomyEditor from '@containers/AnatomyEditor'
import {
  useDeletePresetMutation,
  useUpdatePresetMutation,
  useUpdatePrimaryPresetMutation,
} from '@queries/anatomy/updateAnatomy'
import { confirmDelete } from '@shared/util'

const AnatomyPresets = () => {
  const [formData, setFormData] = useState(null)
  const [selectedPreset, setSelectedPreset] = useState('_')
  const [showNameDialog, setShowNameDialog] = useState(false)
  const [newPresetName, setNewPresetName] = useState('')
  const [breadcrumbs, setBreadcrumbs] = useState([])
  const [isChanged, setIsChanged] = useState(false)

  const nameInputRef = useRef(null)
  const { requestPaste } = usePaste()

  //
  // Hooks
  //

  // get presets lists data
  const { data: presetList = [], isLoading } = useGetAnatomyPresetsQuery()

  useEffect(() => {
    // preselect primary preset if there is one
    // otherwise select default preset
    if (isLoading) return
    const primaryPreset = presetList.find((p) => p.primary)
    if (primaryPreset) {
      setSelectedPreset(primaryPreset.name)
    } else {
      setSelectedPreset('_')
    }
  }, [presetList.length])

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
        if (name !== '_') {
          toast.info(`Preset ${name} set as primary`)
        } else {
          toast.info(`Preset set to built in default`)
        }
      })
      .catch((err) => {
        toast.error(err.message)
      })
  }

  useEffect(() => {
    // TODO
  }, [breadcrumbs])

  const onPasteAnatomy = async () => {
    const pastedContent = await requestPaste()
    if (!pastedContent) {
      toast.error('No content to paste')
      return
    }
    let value
    try {
      value = JSON.parse(pastedContent)
    } catch (e) {
      toast.error('Invalid JSON')
      return
    }
    setFormData(value)
    setIsChanged(true)
  }

  //
  // Render
  //

  return (
    <main>
      {showNameDialog && (
        <Dialog
          header="Preset name"
          isOpen={true}
          onClose={() => setShowNameDialog(false)}
          size="sm"
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

      <Section style={{ maxWidth: 400, minWidth: 300 }}>
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
          <Button label="Paste anatomy" icon="content_paste" onClick={onPasteAnatomy} />

          <Spacer />
          <Button
            label="Set as primary"
            icon="flag"
            disabled={isSelectedPrimary}
            onClick={() => setPrimaryPreset(selectedPreset)}
          />
          <Button
            label="Delete preset"
            icon="delete"
            disabled={selectedPreset === '_'}
            onClick={() => handleDeletePreset(selectedPreset, isSelectedPrimary)}
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
