import { useEffect, useState, useMemo } from 'react'
import axios from 'axios'

import SettingsEditor from '../../containers/settingsEditor'

import { Button } from 'primereact/button'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Dialog } from 'primereact/dialog'
import { confirmDialog, ConfirmDialog } from 'primereact/confirmdialog'
import { InputText } from 'primereact/inputtext'
import { toast } from 'react-toastify'

import { Spacer } from '../../components'
import { loadAnatomyPresets } from '../../utils'

const PresetList = ({ selectedPreset, setSelectedPreset, timestamp }) => {
  const [presetList, setPresetList] = useState([])

  useEffect(() => {
    loadAnatomyPresets().then((r) => setPresetList(r))
  }, [timestamp])

  return (
    <div className="wrapper">
      <DataTable
        value={presetList}
        scrollable
        scrollHeight="flex"
        selectionMode="single"
        responsive="true"
        dataKey="name"
        selection={{ name: selectedPreset }}
        onSelectionChange={(e) => setSelectedPreset(e.value.name)}
      >
        <Column field="title" header="Name" />
        <Column field="primary" header="Primary" style={{ maxWidth: 70 }} />
        <Column field="version" header="Version" style={{ maxWidth: 80 }} />
      </DataTable>
    </div>
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
    axios
      .get(`/api/anatomy/presets/${selectedPreset}`)
      .then((res) => {
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
      />
    )
  }, [schema, originalData])

  return (
    <main>
      <ConfirmDialog />
      {showNameDialog && (
        <Dialog
          header="Preset name"
          visible="true"
          onHide={() => setShowNameDialog(false)}
        >
          <InputText
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
            placeholder="Preset name"
          />
          <Button label="Save" onClick={() => savePreset(newPresetName)} />
        </Dialog>
      )}

      <section className="lighter" style={{ flexBasis: '600px', padding: 0 }}>
        <PresetList
          selectedPreset={selectedPreset}
          setSelectedPreset={setSelectedPreset}
          timestamp={presetListTimestamp}
        />
      </section>

      <section style={{ flexGrow: 1 }} className="invisible">
        <section className="invisible row">
          <Button
            label="Save current preset"
            icon="pi pi-plus"
            disabled={selectedPreset === '_'}
            onClick={() => savePreset(selectedPreset)}
          />
          <Button
            label="Save as a new preset"
            icon="pi pi-plus"
            onClick={() => {
              setNewPresetName('')
              setShowNameDialog(true)
            }}
          />
          <Button
            label="Delete the preset"
            icon="pi pi-times"
            disabled={selectedPreset === '_'}
            onClick={deletePreset}
          />
          <Button
            label="Set as primary preset"
            icon="pi pi-times"
            onClick={setPrimaryPreset}
          />
          <Spacer />
        </section>

        <section className="invisible" style={{ flexGrow: 1 }}>
          <div className="wrapper" style={{ overflowY: 'scroll' }}>
            {editor}
          </div>
        </section>
      </section>
    </main>
  )
}

export default AnatomyPresets
