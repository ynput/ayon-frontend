import { toast } from 'react-toastify'
import { useState } from 'react'
import { ScrollPanel, SaveButton, Spacer, Button } from '@ynput/ayon-react-components'
import { useUpdateProjectAnatomyMutation } from '@queries/project/updateProject'
import ProjectManagerPageLayout from './ProjectManagerPageLayout'
import AnatomyEditor from '@containers/AnatomyEditor'

import copyToClipboard from '@helpers/copyToClipboard'
import { usePaste } from '@context/pasteContext'
import useUserProjectPermissions, { PermissionLevel } from '@hooks/useUserProjectPermissions'
import EmptyPlaceholder from '@components/EmptyPlaceholder/EmptyPlaceholder'
import { useSelector } from 'react-redux'

const ProjectAnatomy = ({ projectName, projectList }) => {
  const isUser = useSelector((state) => state.user.data.isUser)
  const [updateProjectAnatomy, { isLoading: isUpdating }] = useUpdateProjectAnatomyMutation()
  const { requestPaste } = usePaste()

  const { isLoading, permissions: userPermissions } = useUserProjectPermissions(isUser)
  const accessLevel = !isLoading && userPermissions.getAnatomyPermissionLevel(projectName)

  const [formData, setFormData] = useState(null)
  const [isChanged, setIsChanged] = useState(false)



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
        userPermissions.canViewAnatomy(projectName) && (
          <>
            <Button
              label="Copy anatomy"
              icon="content_copy"
              onClick={() => {
                copyToClipboard(JSON.stringify(formData, null, 2))
              }}
            />
            <Button label="Paste anatomy" icon="content_paste" onClick={onPasteAnatomy} />
            {PermissionLevel.readOnly === accessLevel && 'Read-only'}
            <Spacer />
            <SaveButton
              label="Save changes"
              data-tooltip={
                !userPermissions.canEditAnatomy(projectName) ? "You don't have edit permissions" : undefined
              }
              onClick={saveAnatomy}
              active={isChanged && PermissionLevel.readWrite === accessLevel}
              saving={isUpdating}
            />
          </>
        )
      }
    >
      <ScrollPanel style={{ flexGrow: 1 }} className="transparent">
        {isLoading || userPermissions.canViewAnatomy(projectName) ? (
          <AnatomyEditor
            projectName={projectName}
            formData={formData}
            setFormData={setFormData}
            setIsChanged={setIsChanged}
          />
        ) : (
          <EmptyPlaceholder
            icon="settings_alert"
            message="You don't have permission to view this project's anatomy"
          />
        )}
      </ScrollPanel>
    </ProjectManagerPageLayout>
  )
}

export default ProjectAnatomy
