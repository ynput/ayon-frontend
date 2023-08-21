import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { Button, Spacer, Section, Toolbar, ScrollPanel } from '@ynput/ayon-react-components'
import SettingsEditor from '/src/containers/SettingsEditor'
import SaveButton from '/src/components/SaveButton'
import { isEqual } from 'lodash'

const RoleDetail = ({ projectName, role, onChange }) => {
  const [originalData, setOriginalData] = useState(null)
  const [schema, setSchema] = useState(null)
  const [newData, setNewData] = useState(null)
  const [saving, setSaving] = useState(false)

  const roleName = role?.name
  const isProjectLevel = role?.isProjectLevel

  const isChanged = useMemo(() => {
    if (!originalData || !newData) return false
    return !isEqual(originalData, newData)
  }, [newData, originalData])

  // TODO: use react-query
  const loadRoleData = () => {
    if (!roleName) {
      setOriginalData(null)
      return
    }
    axios.get(`/api/roles/${roleName}/${projectName || '_'}`).then((response) => {
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

  const onSave = async () => {
    try {
      setSaving(true)
      await axios.put(`/api/roles/${roleName}/${projectName || '_'}`, newData)
      toast.success('Role saved')
      loadRoleData()
      onChange()
    } catch (err) {
      console.log(err)
    } finally {
      setSaving(false)
    }
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
        context={{
          headerProjectName: projectName,
        }}
      />
    )
  }, [schema, originalData])

  return (
    <Section>
      <Toolbar>
        <Button
          onClick={onDelete}
          label="Delete project role"
          disabled={!(projectName && isProjectLevel)}
          icon="group_remove"
        />
        <Spacer />
        <SaveButton
          onClick={onSave}
          label={`Save ${projectName ? 'project ' : ''}role`}
          active={isChanged}
          saving={saving}
        />
      </Toolbar>
      <ScrollPanel
        className="nopad transparent"
        scrollStyle={{ padding: 0 }}
        style={{ flexGrow: 1 }}
      >
        {editor}
      </ScrollPanel>
    </Section>
  )
}

export default RoleDetail
