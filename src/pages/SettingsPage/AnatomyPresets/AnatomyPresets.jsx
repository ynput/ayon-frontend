import { useEffect, useState, useMemo } from 'react'

import { Dialog } from 'primereact/dialog'
import { confirmDialog, ConfirmDialog } from 'primereact/confirmdialog'
import { InputText } from 'primereact/inputtext'

import { toast } from 'react-toastify'

import SettingsEditor from '/src/containers/SettingsEditor'
import { Spacer, Button, Section, Toolbar, ScrollPanel } from '@ynput/ayon-react-components'

import {
  useGetAnatomyPresetQuery,
  useGetAnatomySchemaQuery,
} from '../../../services/anatomy/getAnatomy'
import PresetList from './PresetList'
import {
  useDeletePresetMutation,
  useUpdatePresetMutation,
  useUpdatePrimaryPresetMutation,
} from '/src/services/anatomy/updateAnatomy'

const AnatomyPresets = () => {
  const [originalData, setOriginalData] = useState(null)
  const [newData, setNewData] = useState(null)
  const [selectedPreset, setSelectedPreset] = useState('_')
  const [showNameDialog, setShowNameDialog] = useState(false)
  const [newPresetName, setNewPresetName] = useState('')

  //
  // Hooks
  //

  const { data: schema } = useGetAnatomySchemaQuery()

  const { data: anatomyData, isSuccess } = useGetAnatomyPresetQuery(
    { preset: selectedPreset },
    { skip: !selectedPreset },
  )

  useEffect(() => {
    if ((isSuccess, anatomyData)) {
      setNewData(anatomyData)
      setOriginalData(anatomyData)
    }
  }, [selectedPreset, isSuccess, anatomyData])

  //
  // Actions
  //

  // RTK Query updateAnatomy.js mutations
  const [updatePreset] = useUpdatePresetMutation()
  const [deletePreset] = useDeletePresetMutation()
  const [updatePrimaryPreset] = useUpdatePrimaryPresetMutation()

  // SAVE PRESET
  const savePreset = (name) => {
    updatePreset({ name, data: newData })
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
  const handleDeletePreset = () => {
    console.log('handleDeletePreset')
    confirmDialog({
      header: 'Delete Preset',
      message: `Are you sure you want to delete the preset ${selectedPreset}?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Delete',
      accept: () => {
        deletePreset({ name: selectedPreset })
          .unwrap()
          .then(() => {
            setSelectedPreset('_')
            toast.info(`Preset ${selectedPreset} deleted`)
          })
          .catch((err) => {
            toast.error(err.message)
          })
      },
      rejectLabel: 'Cancel',
      reject: () => {
        // do nothing
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
          toast.info(`Preset ${selectedPreset} set as primary`)
        } else {
          toast.info(`Unset primary preset`)
        }
      })
      .catch((err) => {
        toast.error(err.message)
      })
  }

  //
  // Render
  //

  const editor = useMemo(() => {
    if (!(schema && originalData)) return 'Loading editor...'

    return <SettingsEditor schema={schema} formData={originalData} onChange={setNewData} />
  }, [schema, originalData])

  return (
    <main>
      <ConfirmDialog />
      {showNameDialog && (
        <Dialog header="Preset name" visible="true" onHide={() => setShowNameDialog(false)}>
          <InputText
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
            placeholder="Preset name"
          />
          <Button label="Save" onClick={() => savePreset(newPresetName)} />
        </Dialog>
      )}

      <Section style={{ maxWidth: 600 }}>
        <PresetList
          selectedPreset={selectedPreset}
          setSelectedPreset={setSelectedPreset}
          onSetPrimary={() => setPrimaryPreset(selectedPreset)}
          onUnsetPrimary={setPrimaryPreset}
          onDelete={handleDeletePreset}
        />
      </Section>

      <Section>
        <Toolbar>
          <Button
            label="Save current preset"
            icon="check"
            disabled={selectedPreset === '_'}
            onClick={() => savePreset(selectedPreset)}
          />
          <Button
            label="Save as a new preset"
            icon="add"
            onClick={() => {
              setNewPresetName('')
              setShowNameDialog(true)
            }}
          />
          <Button
            label="Delete the preset"
            icon="delete"
            disabled={selectedPreset === '_'}
            onClick={handleDeletePreset}
          />
          <Button
            label="Set as primary preset"
            icon="bolt"
            onClick={() => setPrimaryPreset(selectedPreset)}
          />
          <Spacer />
        </Toolbar>

        <ScrollPanel style={{ flexGrow: 1 }} className="transparent">
          {editor}
        </ScrollPanel>
      </Section>
    </main>
  )
}

export default AnatomyPresets
