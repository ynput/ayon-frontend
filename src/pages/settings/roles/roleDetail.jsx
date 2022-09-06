import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { Button, Spacer, TableWrapper } from '/src/components'
import SettingsEditor from '/src/containers/settingsEditor'

const RoleDetail = ({ projectName, roleName, onChange }) => {
  const [originalData, setOriginalData] = useState(null)
  const [schema, setSchema] = useState(null)
  const [newData, setNewData] = useState(null)

  useEffect(() => {
    axios
      .get(`/api/roles/_schema`)
      .then((res) => setSchema(res.data))
      .catch((err) => console.log(err))
  }, [])

  useEffect(() => {
    if (!roleName) {
      setOriginalData(null)
      return
    }
    axios
      .get(`/api/roles/${roleName}/${projectName || '_'}`)
      .then((response) => {
        console.log('Loaded role', roleName, projectName)
        setOriginalData(response.data)
      })
  }, [projectName, roleName])

  const onSave = () => {
    axios
      .put(`/api/roles/${roleName}/${projectName || '_'}`, newData)
      .then(() => {
        toast.success('Role saved')
        onChange()
      })
  }

  const onDelete = () => {
    axios.delete(`/api/roles/${roleName}/${projectName || '_'}`).then(() => {
      toast.success('Role deleted')
      onChange()
    })
  }

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
    <section
      className="invisible"
      style={{ flexGrow: 1, padding: 0, height: '100%' }}
    >
      <section className="invisible row">
        <Button onClick={onSave} label="Save project role" />
        <Button
          onClick={onDelete}
          label="Delete project role"
          disabled={!projectName}
        />
        <Spacer />
      </section>
      <section className="lighter" style={{ flexGrow: 1 }}>
        <div
          className="wrapper"
          style={{
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'scroll',
            gap: 12,
            padding: 12,
          }}
        >
          {editor}
        </div>
      </section>
    </section>
  )
}

export default RoleDetail
