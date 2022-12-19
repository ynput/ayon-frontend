import { useEffect, useState, useMemo, useRef } from 'react'
import axios from 'axios'

import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Dialog } from 'primereact/dialog'
import { confirmDialog, ConfirmDialog } from 'primereact/confirmdialog'
import { InputText } from 'primereact/inputtext'
import { ContextMenu } from 'primereact/contextmenu'
import { toast } from 'react-toastify'

import SettingsEditor from '/src/containers/settingsEditor'
import {
  Spacer,
  Button,
  Section,
  Toolbar,
  TablePanel,
  ScrollPanel,
} from '@ynput/ayon-react-components'
import { loadAnatomyPresets } from '/src/utils'

const PresetList = ({
  selectedPreset,
  setSelectedPreset,
  timestamp,
  onSetPrimary,
  onUnsetPrimary,
  onDelete,
}) => {
  const [presetList, setPresetList] = useState([])
  const [loading, setLoading] = useState(false)
  const contextMenuRef = useRef(null)

  useEffect(() => {
    setLoading(true)
    loadAnatomyPresets()
      .then((r) => setPresetList(r))
      .finally(() => setLoading(false))
  }, [timestamp])

  const contextMenuModel = useMemo(() => {
    return [
      {
        label: 'Set as primary',
        command: onSetPrimary,
      },
      {
        label: 'Unset primary preset',
        command: onUnsetPrimary,
      },
      {
        label: 'Delete',
        disabled: selectedPreset === '_',
        command: onDelete,
      },
    ]
  }, [selectedPreset, presetList])

  return (
    <TablePanel loading={loading}>
      <ContextMenu model={contextMenuModel} ref={contextMenuRef} />
      <DataTable
        value={presetList}
        scrollable
        scrollHeight="flex"
        selectionMode="single"
        responsive="true"
        dataKey="name"
        selection={{ name: selectedPreset }}
        onSelectionChange={(e) => setSelectedPreset(e.value.name)}
        onContextMenuSelectionChange={(e) => setSelectedPreset(e.value.name)}
        onContextMenu={(e) => contextMenuRef.current.show(e.originalEvent)}
      >
        <Column field="title" header="Name" />
        <Column field="primary" header="Primary" style={{ maxWidth: 70 }} />
        <Column field="version" header="Version" style={{ maxWidth: 80 }} />
      </DataTable>
    </TablePanel>
  )
}

const AnatomyPresets = () => {
  const [schema, setSchema] = useState(null)
  const [originalData, setOriginalData] = useState(null)
  const [newData, setNewData] = useState(null)
  const [selectedPreset, setSelectedPreset] = useState('_')
  const [showNameDialog, setShowNameDialog] = useState(false)
  const [newPresetName, setNewPresetName] = useState('')
  const [presetListTimestamp, setPresetListTimestamp] = useState(0)

  //
  // Hooks
  //

  useEffect(() => {
    axios.get('/api/anatomy/schema').then((res) => setSchema(res.data))
  }, [])

  useEffect(() => {
    axios.get(`/api/anatomy/presets/${selectedPreset}`).then((res) => {
      setNewData(res.data)
      setOriginalData(res.data)
    })
  }, [selectedPreset])

  //
  // Actions
  //

  const savePreset = (name) => {
    axios
      .put(`/api/anatomy/presets/${name}`, newData)
      .then(() => {
        setPresetListTimestamp(presetListTimestamp + 1)
        setSelectedPreset(name)
        setShowNameDialog(false)
        toast.info(`Preset ${name} saved`)
      })
      .catch((err) => {
        toast.error(err.message)
      })
  }

  const deletePreset = () => {
    console.log('deletePreset')
    confirmDialog({
      header: 'Delete Preset',
      message: `Are you sure you want to delete the preset ${selectedPreset}?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Delete',
      accept: () => {
        axios
          .delete(`/api/anatomy/presets/${selectedPreset}`)
          .then(() => {
            setPresetListTimestamp(presetListTimestamp + 1)
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

  const setPrimaryPreset = () => {
    axios
      .post(`/api/anatomy/presets/${selectedPreset}/primary`)
      .then(() => {
        setPresetListTimestamp(presetListTimestamp + 1)
        toast.info(`Preset ${selectedPreset} set as primary`)
      })
      .catch((err) => {
        toast.error(err.message)
      })
  }

  const unsetPrimaryPreset = () => {
    axios
      .post(`/api/anatomy/presets/_/primary`)
      .then(() => {
        setPresetListTimestamp(presetListTimestamp + 1)
        toast.info(`Unset primary preset`)
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
          timestamp={presetListTimestamp}
          onSetPrimary={setPrimaryPreset}
          onUnsetPrimary={unsetPrimaryPreset}
          onDelete={deletePreset}
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
            onClick={deletePreset}
          />
          <Button label="Set as primary preset" icon="bolt" onClick={setPrimaryPreset} />
          <Spacer />
        </Toolbar>

        <ScrollPanel style={{ flexGrow: 1 }} scrollStyle={{ padding: 0 }} className="transparent">
          {editor}
        </ScrollPanel>
      </Section>
    </main>
  )
}

export default AnatomyPresets
