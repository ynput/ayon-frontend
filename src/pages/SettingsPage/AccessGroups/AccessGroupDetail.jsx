import { useState, useMemo } from 'react'
import { toast } from 'react-toastify'
import {
  Button,
  Spacer,
  Section,
  Toolbar,
  ScrollPanel,
  SaveButton,
} from '@ynput/ayon-react-components'
import SettingsEditor from '/src/containers/SettingsEditor'
import { isEqual } from 'lodash'
import {
  useGetAccessGroupQuery,
  useGetAccessGroupSchemaQuery,
} from '/src/services/accessGroups/getAccessGroups'
import {
  useDeleteAccessGroupMutation,
  useUpdateAccessGroupMutation,
} from '/src/services/accessGroups/updateAccessGroups'
import confirmDelete from '/src/helpers/confirmDelete'

const AccessGroupDetail = ({ projectName, accessGroup }) => {
  const [newData, setNewData] = useState(null)
  const accessGroupName = accessGroup?.name

  const { data: originalData } = useGetAccessGroupQuery(
    {
      name: accessGroupName,
      projectName: projectName || '_',
    },
    { skip: !accessGroupName },
  )

  const { data: schema } = useGetAccessGroupSchemaQuery()

  // mutations
  const [updateAccessGroup, { isLoading: saving }] = useUpdateAccessGroupMutation()
  const [deleteAccessGroup] = useDeleteAccessGroupMutation()

  const isProjectLevel = accessGroup?.isProjectLevel

  const isChanged = useMemo(() => {
    if (!originalData || !newData) return false
    return !isEqual(originalData, newData)
  }, [newData, originalData])

  const onSave = async () => {
    try {
      await updateAccessGroup({
        name: accessGroupName,
        projectName: projectName || '_',
        data: newData,
      }).unwrap()
      toast.success('Access group saved')
    } catch (err) {
      console.error(err)
      toast.error('Unable to save access group')
    }
  }

  const onDelete = async () =>
    confirmDelete({
      label: 'Access group',
      accept: async () => await deleteAccessGroup({ name: accessGroupName, projectName }).unwrap(),
    })

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
          label="Delete project access group"
          disabled={!(projectName && isProjectLevel)}
          icon="group_remove"
        />
        <Spacer />
        <SaveButton
          onClick={onSave}
          label={`Save ${projectName ? 'project ' : ''}access group`}
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

export default AccessGroupDetail
