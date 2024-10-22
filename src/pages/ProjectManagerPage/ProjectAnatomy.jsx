import { toast } from 'react-toastify'
import { useState } from 'react'
import { ScrollPanel, SaveButton, Spacer, Button } from '@ynput/ayon-react-components'
import { useUpdateProjectAnatomyMutation } from '@queries/project/updateProject'
import ProjectManagerPageLayout from './ProjectManagerPageLayout'
import AnatomyEditor from '@containers/AnatomyEditor'

import copyToClipboard from '@helpers/copyToClipboard'
import { usePaste } from '@context/pasteContext'
import useUserProjectPermissions, { UserPermissionsLevel } from '@hooks/useUserProjectPermissions'

const ProjectAnatomy = ({ projectName, projectList }) => {
  const [formData, setFormData] = useState(null)
  const [isChanged, setIsChanged] = useState(false)

  const [updateProjectAnatomy, { isLoading: isUpdating }] = useUpdateProjectAnatomyMutation()
  const { requestPaste } = usePaste()

  const userPermissions = useUserProjectPermissions(projectName)
  const accessLevel = userPermissions.getAnatomyPermissionLevel()

  const saveAnatomy = () => {
    updateProjectAnatomy({ projectName, anatomy: formData })
      .unwrap()
      .then(() => {
        toast.info(`Anatomy saved`)
      })
      .catch((err) => {
        console.log(err)
        toast.error(
          <>
            <strong>Failed to save anatomy</strong>
            <br />
            {err.data.detail}
          </>,
        )
      })
  }

  const onPasteAnatomy = async () => {
    const pastedContent = await requestPaste()
    if (!pastedContent) {
      toast.error('No content to paste')
      return
    }
    let value
    try {
      value = JSON.parse(pastedContent)
    } catch (e) {
      toast.error('Invalid JSON')
      return
    }
    setFormData(value)
  }

  return (
    <ProjectManagerPageLayout
      projectList={projectList}
      toolbar={
        <>
          <Button
            label="Copy anatomy"
            icon="content_copy"
            onClick={() => {
              copyToClipboard(JSON.stringify(formData, null, 2))
            }}
          />
          <Button label="Paste anatomy" icon="content_paste" onClick={onPasteAnatomy} />
          {UserPermissionsLevel.readOnly === accessLevel && "Read-only"}
          <Spacer />
          <SaveButton
            label="Save changes"
            data-tooltip={UserPermissionsLevel.readWrite !== accessLevel ?  "You don't have edit permissions" : undefined}
            onClick={saveAnatomy}
            active={isChanged && UserPermissionsLevel.readWrite === accessLevel}
            saving={isUpdating}
          />
        </>
      }
    >
      <ScrollPanel style={{ flexGrow: 1 }} className="transparent">
        {UserPermissionsLevel.none !== accessLevel ? (
        <AnatomyEditor
          projectName={projectName}
          formData={formData}
          setFormData={setFormData}
          setIsChanged={setIsChanged}
        />) : "You don't have access to this project's anatomy. We should redirect you somewhere else."}
      </ScrollPanel>
    </ProjectManagerPageLayout>
  )
}

export default ProjectAnatomy
