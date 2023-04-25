import { toast } from 'react-toastify'
import { useState, useEffect, useMemo } from 'react'
import { Section, ScrollPanel, Button } from '@ynput/ayon-react-components'
import SettingsEditor from '/src/containers/SettingsEditor'
import { useGetAnatomySchemaQuery } from '../../services/anatomy/getAnatomy'
import { useUpdateProjectAnatomyMutation } from '/src/services/project/updateProject'
import { useGetProjectAnatomyQuery } from '/src/services/project/getProject'
import ProjectManagerPageLayout from './ProjectManagerPageLayout'

const ProjectAnatomy = ({ projectName, toolbar, projectList }) => {
  const [newData, setNewData] = useState(null)

  const { data: schema, isLoading: isLoadingSchema } = useGetAnatomySchemaQuery()

  const {
    data: originalData,
    isLoading: isLoadingAnatomy,
    isSuccess,
    isFetching,
  } = useGetProjectAnatomyQuery({
    projectName,
  })

  // TODO: RTK QUERY
  useEffect(() => {
    if (isSuccess) [setNewData(originalData)]
  }, [originalData, isSuccess, projectName, isFetching])

  const [updateProjectAnatomy] = useUpdateProjectAnatomyMutation()

  const saveAnatomy = () => {
    updateProjectAnatomy({ projectName, anatomy: newData })
      .unwrap()
      .then(() => {
        toast.info(`Anatomy saved`)
      })
      .catch((err) => {
        toast.error(err.message)
      })
  }

  const editor = useMemo(() => {
    if (isLoadingSchema || isLoadingAnatomy || isFetching) return 'Loading editor...'

    return <SettingsEditor schema={schema} formData={originalData} onChange={setNewData} />
  }, [schema, originalData, isLoadingSchema, isLoadingAnatomy, isSuccess, isFetching])

  return (
    <ProjectManagerPageLayout
      {...{ toolbar, projectList }}
      toolbarMore={<Button label="Update anatomy" icon="save" onClick={saveAnatomy} />}
    >
      <Section>
        <Section>
          <ScrollPanel className="transparent nopad" style={{ flexGrow: 1 }}>
            {editor}
          </ScrollPanel>
        </Section>
      </Section>
    </ProjectManagerPageLayout>
  )
}

export default ProjectAnatomy
