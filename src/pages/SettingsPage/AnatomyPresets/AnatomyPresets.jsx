import { useEffect, useState, useMemo } from 'react'

import { Dialog } from 'primereact/dialog'
import { InputText } from 'primereact/inputtext'

import { toast } from 'react-toastify'

import SettingsEditor from '/src/containers/SettingsEditor'
import {
  Spacer,
  Button,
  Section,
  Toolbar,
  ScrollPanel,
  SaveButton,
} from '@ynput/ayon-react-components'

import {
  useGetAnatomyPresetQuery,
  useGetAnatomyPresetsQuery,
  useGetAnatomySchemaQuery,
} from '../../../services/anatomy/getAnatomy'
import PresetList from './PresetList'
import {
  useDeletePresetMutation,
  useUpdatePresetMutation,
  useUpdatePrimaryPresetMutation,
} from '/src/services/anatomy/updateAnatomy'
import { isEqual } from 'lodash'
import confirmDelete from '/src/helpers/confirmDelete'

const AnatomyPresets = () => {
  const [originalData, setOriginalData] = useState(null)
  const [newData, setNewData] = useState(null)
  const [selectedPreset, setSelectedPreset] = useState('_')
  const [showNameDialog, setShowNameDialog] = useState(false)
  const [newPresetName, setNewPresetName] = useState('')

  //
  // Hooks
  //

  // get presets lists data
  const { data: presetList = [], isLoading } = useGetAnatomyPresetsQuery()

  const isSelectedPrimary = useMemo(() => {
    // find preset in list
    const preset = presetList.find((p) => p.name === selectedPreset)
    return preset && preset.primary === 'PRIMARY'
  }, [selectedPreset, presetList])

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

  const isChanged = useMemo(() => {
    if (!originalData || !newData) return false
    return !isEqual(originalData, newData)
  }, [newData, originalData])

  //
  // Actions
  //

  // RTK Query updateAnatomy.js mutations
  const [updatePreset, { isLoading: isUpdating }] = useUpdatePresetMutation()
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

  const onSetBreadcrumbs = (e) => {
    console.log('onSetBreadcrumbs', e)
  }

  //
  // Render
  //

  const editor = useMemo(() => {
    if (!(schema && originalData)) return 'Loading editor...'

    return (
      <SettingsEditor
        schema={schema}
        formData={originalData}
        onChange={setNewData}
        onSetBreadcrumbs={onSetBreadcrumbs}
      />
    )
  }, [schema, originalData])

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
            label="Set as primary"
            icon="flag"
            onClick={() => setPrimaryPreset(selectedPreset)}
          />
          <Button
            label="Delete the preset"
            icon="delete"
            disabled={selectedPreset === '_'}
            onClick={() => handleDeletePreset(selectedPreset, isSelectedPrimary)}
          />
          <Spacer />
          <Button
            label="Save as a new preset"
            icon="add"
            onClick={() => {
              setNewPresetName('')
              setShowNameDialog(true)
            }}
          />
          <SaveButton
            label="Save Current Preset"
            saving={isUpdating}
            active={isChanged && selectedPreset !== '_'}
            onClick={() => savePreset(selectedPreset)}
          />
        </Toolbar>

        <ScrollPanel style={{ flexGrow: 1 }} className="transparent">
          {editor}
        </ScrollPanel>
      </Section>
    </main>
  )
}

export default AnatomyPresets
