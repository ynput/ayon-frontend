import { toast } from 'react-toastify'
import { useState } from 'react'
import { Section, SaveButton, Spacer } from '@ynput/ayon-react-components'
import { useUpdateProjectAnatomyMutation } from '/src/services/project/updateProject'
import ProjectManagerPageLayout from './ProjectManagerPageLayout'
import AnatomyEditor from '/src/containers/AnatomyEditor'

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
          <Spacer />
          <SaveButton
            label="Save changes"
            onClick={saveAnatomy}
            active={isChanged}
            saving={isUpdating}
            style={{ marginRight: 20 }}
          />
        </>
      }
    >
      <Section>
        <Section>
          <AnatomyEditor
            projectName={projectName}
            formData={formData}
            setFormData={setFormData}
            setIsChanged={setIsChanged}
          />
        </Section>
      </Section>
    </ProjectManagerPageLayout>
  )
}

export default ProjectAnatomy
