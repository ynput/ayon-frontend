import { useEffect, useState } from 'react'
import { Dialog } from 'primereact/dialog'
import { InputText } from 'primereact/inputtext'
import { Button } from 'primereact/button'
import { Dropdown } from 'primereact/dropdown'
import axios from 'axios'
import AnatomyEditor from '../../containers/anatomyEditor'

const NewProjectDialog = ({ visible, onHide }) => {
  const [schema, setSchema] = useState(null)
  const [formData, setFormData] = useState(null)
  const [selectedPreset, setSelectedPreset] = useState('_')

  useEffect(() => {
    axios.get('/api/anatomy/schema').then((res) => {
      setSchema(res.data)
    })
  }, [])

  useEffect(() => {
    axios.get('/api/anatomy/presets/_').then((res) => {
      console.log(res.data)
      setFormData(res.data)
    })
  }, [])

  if (!visible) {
    return <></>
  }

  const footer = (
    <Button
      icon="pi pi-plus"
      label="Create"
      className="p-button-info"
      onClick={onHide}
      style={{ width: 120 }}
    />
  )

  return (
    <Dialog
      header="Create a new project"
      footer={footer}
      visible={visible}
      onHide={onHide}
      style={{
        width: '50vw',
        height: '80%',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: 8,
            marginBottom: 8,
          }}
        >
          <InputText placeholder="Project Name" style={{ width: '100%' }} />
          <Dropdown placeholder="Preset" />
        </div>
        <AnatomyEditor
          schema={schema}
          formData={formData}
          onChange={setFormData}
        />
      </div>
    </Dialog>
  )
}

export default NewProjectDialog
