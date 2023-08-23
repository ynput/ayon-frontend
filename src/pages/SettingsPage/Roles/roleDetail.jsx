import { useState, useMemo } from 'react'
import { toast } from 'react-toastify'
import { Button, Spacer, Section, Toolbar, ScrollPanel } from '@ynput/ayon-react-components'
import SettingsEditor from '/src/containers/SettingsEditor'
import SaveButton from '/src/components/SaveButton'
import { isEqual } from 'lodash'
import { useGetRoleQuery, useGetRolesSchemaQuery } from '/src/services/roles/getRoles'
import { useDeleteRoleMutation, useUpdateRoleMutation } from '/src/services/roles/updateRoles'

const RoleDetail = ({ projectName, role }) => {
  const [newData, setNewData] = useState(null)
  const roleName = role?.name

  const { data: originalData } = useGetRoleQuery(
    {
      roleName,
      projectName: projectName || '_',
    },
    { skip: !roleName },
  )

  const { data: schema } = useGetRolesSchemaQuery()

  // mutations
  const [updateRole, { isLoading: saving }] = useUpdateRoleMutation()
  const [deleteRole] = useDeleteRoleMutation()

  const isProjectLevel = role?.isProjectLevel

  const isChanged = useMemo(() => {
    if (!originalData || !newData) return false
    return !isEqual(originalData, newData)
  }, [newData, originalData])

  const onSave = async () => {
    try {
      await updateRole({
        name: roleName,
        projectName: projectName || '_',
        data: newData,
      }).unwrap()
      toast.success('Role saved')
    } catch (err) {
      console.error(err)
      toast.error('Unable to save role')
    }
  }

  const onDelete = async () => {
    try {
      await deleteRole({ name: roleName, projectName }).unwrap()
      toast.success('Role deleted')
    } catch (err) {
      console.error(err)
      toast.error('Unable to delete role')
    }
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
