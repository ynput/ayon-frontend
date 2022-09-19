import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { Button, Spacer } from '/src/components'
import SettingsEditor from '/src/containers/settingsEditor'

const RoleDetail = ({ projectName, role, onChange }) => {
  const [originalData, setOriginalData] = useState(null)
  const [schema, setSchema] = useState(null)
  const [newData, setNewData] = useState(null)

  const roleName = role?.name
  const isProjectLevel = role?.isProjectLevel

  const loadRoleData = () => {
    if (!roleName) {
      setOriginalData(null)
      return
    }
    axios
      .get(`/api/roles/${roleName}/${projectName || '_'}`)
      .then((response) => {
        console.log('Loaded role', roleName, projectName)
        setOriginalData(response.data)
        setNewData(response.data)
      })
  }

  useEffect(() => {
    axios
      .get(`/api/roles/_schema`)
      .then((res) => setSchema(res.data))
      .catch((err) => console.log(err))
  }, [])

  useEffect(() => {
    loadRoleData()
  }, [projectName, roleName])

  const onSave = () => {
    axios
      .put(`/api/roles/${roleName}/${projectName || '_'}`, newData)
      .then(() => {
        toast.success('Role saved')
        loadRoleData()
        onChange()
      })
  }

  const onDelete = () => {
    axios.delete(`/api/roles/${roleName}/${projectName || '_'}`).then(() => {
      toast.success('Role deleted')
      loadRoleData()
      onChange()
    })
  }

  const editor = useMemo(() => {
    if (!(schema && originalData)) return <></>

    return (
      <SettingsEditor
        schema={schema}
        formData={originalData}
        onChange={setNewData}
        level={isProjectLevel ? 'project' : 'studio'}
      />
    )
  }, [schema, originalData])

  return (
    <section
      className="invisible"
      style={{ flexGrow: 1, padding: 0, height: '100%' }}
    >
      <section className="invisible row">
        <Button
          onClick={onSave}
          label={`Save ${projectName ? 'project ' : ''}role`}
          icon="check"
        />
        <Button
          onClick={onDelete}
          label="Delete project role"
          disabled={!(projectName && isProjectLevel)}
          icon="group_remove"
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
