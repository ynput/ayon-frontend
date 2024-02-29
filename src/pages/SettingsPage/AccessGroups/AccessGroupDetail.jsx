import { useState, useMemo, useEffect } from 'react'
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
  const [originalData, setOriginalData] = useState(null)
  const [formData, setFormData] = useState(null)
  const accessGroupName = accessGroup?.name

  const { data } = useGetAccessGroupQuery(
    {
      name: accessGroupName,
      projectName: projectName || '_',
    },
    { skip: !accessGroupName },
  )

  const { data: schema } = useGetAccessGroupSchemaQuery()

  useEffect(() => {
    if (!data) return
    setFormData(data)
    setOriginalData(data)
  }, [data])

  // mutations
  const [updateAccessGroup, { isLoading: saving }] = useUpdateAccessGroupMutation()
  const [deleteAccessGroup] = useDeleteAccessGroupMutation()

  const isProjectLevel = accessGroup?.isProjectLevel

  const isChanged = useMemo(() => {
    if (!originalData || !formData) return false
    return !isEqual(originalData, formData)
  }, [formData, originalData])

  const onSave = async () => {
    try {
      await updateAccessGroup({
        name: accessGroupName,
        projectName: projectName || '_',
        data: formData,
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
        <SettingsEditor
          schema={schema}
          originalData={originalData}
          formData={formData}
          onChange={setFormData}
          level={isProjectLevel ? 'project' : 'studio'}
          context={{
            headerProjectName: projectName,
          }}
        />
      </ScrollPanel>
    </Section>
  )
}

export default AccessGroupDetail
