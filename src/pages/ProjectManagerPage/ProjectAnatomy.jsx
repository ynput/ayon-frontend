import { toast } from 'react-toastify'
import { useState } from 'react'
import { ScrollPanel, SaveButton, Spacer, Button } from '@ynput/ayon-react-components'
import { useUpdateProjectAnatomyMutation } from '/src/services/project/updateProject'
import ProjectManagerPageLayout from './ProjectManagerPageLayout'
import AnatomyEditor from '/src/containers/AnatomyEditor'

import copyToClipboard from '/src/helpers/copyToClipboard'
import { usePaste } from '/src/context/pasteContext'

const ProjectAnatomy = ({ projectName, projectList }) => {
  const [formData, setFormData] = useState(null)
  const [isChanged, setIsChanged] = useState(false)

  const [updateProjectAnatomy, { isLoading: isUpdating }] = useUpdateProjectAnatomyMutation()
  const { requestPaste } = usePaste()

  const saveAnatomy = () => {
    updateProjectAnatomy({ projectName, anatomy: formData })
      .unwrap()
      .then(() => {
        toast.info(`Anatomy saved`)
      })
      .catch((err) => {
        toast.error(err.message)
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
          <Spacer />
          <SaveButton
            label="Save changes"
            onClick={saveAnatomy}
            active={isChanged}
            saving={isUpdating}
          />
        </>
      }
    >
      <ScrollPanel style={{ flexGrow: 1 }} className="transparent">
        <AnatomyEditor
          projectName={projectName}
          formData={formData}
          setFormData={setFormData}
          setIsChanged={setIsChanged}
        />
      </ScrollPanel>
    </ProjectManagerPageLayout>
  )
}

export default ProjectAnatomy
