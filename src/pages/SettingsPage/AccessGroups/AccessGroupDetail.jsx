import { useState, useMemo, useEffect } from 'react'
import { toast } from 'react-toastify'
import {
  Button,
  Section,
  Toolbar,
  Spacer,
  ScrollPanel,
  SaveButton,
} from '@ynput/ayon-react-components'
import SettingsEditor from '@containers/SettingsEditor'
import { useGetAccessGroupsQuery } from '@queries/accessGroups/getAccessGroups'
import { isEqual } from 'lodash'
import {
  useGetAccessGroupQuery,
  useGetAccessGroupSchemaQuery,
} from '@queries/accessGroups/getAccessGroups'
import {
  useDeleteAccessGroupMutation,
  useSaveAccessGroupMutation,
} from '@queries/accessGroups/updateAccessGroups'
import confirmDelete from '@helpers/confirmDelete'

const PROJECT_GROUP_MSG = 'Clear project overrides'

const AccessGroupDetail = ({ projectName, accessGroupName }) => {
  const [originalData, setOriginalData] = useState(null)
  const [formData, setFormData] = useState(null)

  const { data } = useGetAccessGroupQuery(
    {
      accessGroupName: accessGroupName,
      projectName: projectName || '_',
    },
    { skip: !accessGroupName },
  )
  const { data: schema } = useGetAccessGroupSchemaQuery()

  const { data: accessGroupList = [] } = useGetAccessGroupsQuery({
    projectName: projectName || '_',
  })

  const isProjectLevel = useMemo(() => {
    for (const accessGroup of accessGroupList) {
      if (accessGroup?.name === accessGroupName) return accessGroup.isProjectLevel
    }
  }, [accessGroupName, accessGroupList])

  useEffect(() => {
    if (!data) return
    setFormData(data)
    setOriginalData(data)
  }, [data])

  // mutations
  const [saveAccessGroup, { isLoading: saving }] = useSaveAccessGroupMutation()
  const [deleteAccessGroup] = useDeleteAccessGroupMutation()

  const isChanged = useMemo(() => {
    if (!originalData || !formData) return false
    return !isEqual(originalData, formData)
  }, [formData, originalData])

  const onSave = async () => {
    try {
      await saveAccessGroup({
        accessGroupName,
        projectName: projectName || '_',
        data: formData,
      }).unwrap()
      toast.success('Project access group settings saved')
    } catch (err) {
      console.error(err)
      toast.error('Unable to save access group')
    }
  }

  const onDeleteLocalGroupSettings = async () =>
    confirmDelete({
      header: 'Clear project overrides',
      deleteLabel: 'Clear',
      label: 'Project overrides',
      accept: async () => await deleteAccessGroup({ accessGroupName, projectName }).unwrap(),
      message:
        'Are you sure you want to delete all project override settings for this access group?',
    })

  const isLocalProject = !!projectName
  // This conditions checks if there are any local (NOT global) project settings for user group
  const noLocalSettings = projectName && !isProjectLevel


  const permissionsEditor = useMemo(() => {
    return (
        <SettingsEditor
          schema={schema}
          originalData={originalData}
          formData={formData}
          onChange={setFormData}
          level={projectName ? 'project' : 'studio'}
          context={{
            headerProjectName: projectName,
          }}
        />
    )
  }, [schema, originalData, formData, projectName, setFormData])


  return (
    <Section style={{ flex: 2 }}>
      <Toolbar>
        <Spacer />
        {isLocalProject && (
          <Button
            onClick={onDeleteLocalGroupSettings}
            label={PROJECT_GROUP_MSG}
            disabled={noLocalSettings}
            icon="delete"
          />
        )}
        <SaveButton onClick={onSave} label="Save Changes" active={isChanged} saving={saving} />
      </Toolbar>
      <ScrollPanel
        className="nopad transparent"
        scrollStyle={{ padding: 0 }}
        style={{ flexGrow: 1 }}
      >
        {permissionsEditor}
      </ScrollPanel>
    </Section>
  )
}

export default AccessGroupDetail
