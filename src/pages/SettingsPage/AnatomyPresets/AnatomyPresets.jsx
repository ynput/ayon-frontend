import { useEffect, useState, useMemo, useRef } from 'react'

import { copyToClipboard } from '@shared/util'
import { usePaste } from '@context/PasteContext'

import { InputText } from 'primereact/inputtext'

import { toast } from 'react-toastify'

import PresetNameDialog from './PresetNameDialog'

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
  useDeleteAnatomyPresetMutation,
  useUpdateAnatomyPresetMutation,
  useRenameAnatomyPresetMutation,
  useSetPrimaryPresetMutation,
} from '@queries/anatomy/updateAnatomy'
import { confirmDelete } from '@shared/util'

const AnatomyPresets = () => {
  const [formData, setFormData] = useState(null)
  const [selectedPreset, setSelectedPreset] = useState('_')
  const [breadcrumbs, setBreadcrumbs] = useState([])
  const [isChanged, setIsChanged] = useState(false)

  const { requestPaste } = usePaste()

  const [dialogConfig, setDialogConfig] = useState({
    isOpen: false,
    title: '',
    placeholder: '',
    initialValue: '',
    onSubmit: () => {},
  })

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
    return preset && preset.primary
  }, [selectedPreset, presetList])

  //
  // Actions
  //

  // RTK Query updateAnatomy.js mutations
  const [updatePreset, { isLoading: isUpdating }] = useUpdateAnatomyPresetMutation()
  const [deletePreset] = useDeleteAnatomyPresetMutation()
  const [renamePreset] = useRenameAnatomyPresetMutation()
  const [updatePrimaryPreset] = useSetPrimaryPresetMutation()

  // SAVE PRESET
  const savePreset = (presetName) => {
    updatePreset({ presetName, anatomy: formData })
      .unwrap()
      .then(() => {
        setSelectedPreset(presetName)
        toast.info(`Preset ${presetName} saved`)
      })
      .catch((err) => {
        toast.error(err.message)
      })
  }

  // DELETE PRESET
  const handleDeletePreset = (presetName, isPrimary) => {
    confirmDelete({
      label: `Preset: ${presetName}`,
      accept: async () => {
        await deletePreset({ presetName }).unwrap()
        if (isPrimary) {
          setSelectedPreset('_')
        }
      },
    })
  }

  // SET PRIMARY PRESET
  const setPrimaryPreset = (presetName = '_') => {
    // if name is not provided, set primary preset to "_"
    // this is used to unset the primary preset
    updatePrimaryPreset({ presetName })
      .unwrap()
      .then(() => {
        if (presetName !== '_') {
          toast.info(`Preset ${presetName} set as primary`)
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
  // Dialog name dialog
  //

  const openCreatePresetDialog = () => {
    setDialogConfig({
      isOpen: true,
      title: 'Create New Preset',
      placeholder: 'Preset name',
      initialValue: '',
      onSubmit: (name) => {
        savePreset(name)
      },
    })
  }

  const openRenamePresetDialog = (currentName) => {
    setDialogConfig({
      isOpen: true,
      title: 'Rename Preset',
      placeholder: 'New preset name',
      initialValue: currentName,
      onSubmit: (newName) => {
        renamePreset({ presetName: currentName, renamePresetModel:{name: newName} })
          .unwrap()
          .then(() => {
            setSelectedPreset(newName)
            toast.info(`Preset renamed to ${newName}`)
          })
          .catch(() => {
            toast.error('Unable to rename preset')
          })
      },
    })
  }

  const closeDialog = () => {
    setDialogConfig((prev) => ({ ...prev, isOpen: false }))
  }

  //
  // Render
  //

  return (
    <main>
      <PresetNameDialog
        isOpen={dialogConfig.isOpen}
        title={dialogConfig.title}
        placeholder={dialogConfig.placeholder}
        initialValue={dialogConfig.initialValue}
        onSubmit={(value) => {
          dialogConfig.onSubmit(value)
          closeDialog()
        }}
        onClose={closeDialog}
      />

      <Section style={{ maxWidth: 400, minWidth: 300 }}>
        <PresetList
          selectedPreset={selectedPreset}
          setSelectedPreset={setSelectedPreset}
          onSetPrimary={setPrimaryPreset}
          onDelete={handleDeletePreset}
          onRename={(name) => openRenamePresetDialog(name)}
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
            onClick={openCreatePresetDialog}
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
