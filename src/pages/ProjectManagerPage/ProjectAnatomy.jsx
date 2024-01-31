import { toast } from 'react-toastify'
import { useState } from 'react'
import { ScrollPanel, SaveButton, Spacer, Button } from '@ynput/ayon-react-components'
import { useUpdateProjectAnatomyMutation } from '/src/services/project/updateProject'
import ProjectManagerPageLayout from './ProjectManagerPageLayout'
import AnatomyEditor from '/src/containers/AnatomyEditor'

import copyToClipboard from '/src/helpers/copyToClipboard'
import pasteFromClipboard from '/src/helpers/pasteFromClipboard'

const ProjectAnatomy = ({ projectName, projectList }) => {
  const [formData, setFormData] = useState(null)
  const [isChanged, setIsChanged] = useState(false)

  const [updateProjectAnatomy, { isLoading: isUpdating }] = useUpdateProjectAnatomyMutation()

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
          <Button
            label="Paste anatomy"
            icon="content_paste"
            onClick={async () => {
              const content = await pasteFromClipboard()
              if (!content) {
                toast.error('Clipboard is empty')
                return
              }
              try {
                const data = JSON.parse(content)
                setFormData(data)
                setIsChanged(true)
                toast.info('Anatomy pasted')
              } catch (err) {
                console.log(err)
                toast.error('Clipboard content is not valid JSON')
              }
            }}
          />
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
