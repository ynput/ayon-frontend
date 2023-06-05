import { toast } from 'react-toastify'
import { useState, useEffect, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { Section, ScrollPanel, Button } from '@ynput/ayon-react-components'
import SettingsEditor from '/src/containers/SettingsEditor'
import { useGetAnatomySchemaQuery } from '../../services/anatomy/getAnatomy'
import { useUpdateProjectAnatomyMutation } from '/src/services/project/updateProject'
import { useGetProjectAnatomyQuery } from '/src/services/project/getProject'
import { setUri } from '/src/features/context'
import ProjectManagerPageLayout from './ProjectManagerPageLayout'

const ProjectAnatomy = ({ projectName, projectList }) => {
  const [newData, setNewData] = useState(null)
  const dispatch = useDispatch()

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

  const onSetBreadcrumbs = (path) => {
    let uri = 'ayon+anatomy://'
    uri += path.join('/')
    uri += `?project=${projectName}`
    dispatch(setUri(uri))
  }

  const editor = useMemo(() => {
    if (isLoadingSchema || isLoadingAnatomy || isFetching) return 'Loading editor...'

    return (
      <SettingsEditor
        schema={schema}
        formData={originalData}
        onChange={setNewData}
        onSetBreadcrumbs={onSetBreadcrumbs}
      />
    )
  }, [schema, originalData, isLoadingSchema, isLoadingAnatomy, isSuccess, isFetching])

  return (
    <ProjectManagerPageLayout
      projectList={projectList}
      toolbar={<Button label="Save Changes" icon="check" onClick={saveAnatomy} />}
    >
      <Section>
        <Section>
          {projectName ? (
            <ScrollPanel className="transparent nopad" style={{ flexGrow: 1 }}>
              {editor}
            </ScrollPanel>
          ) : (
            'Select a project to view its anatomy'
          )}
        </Section>
      </Section>
    </ProjectManagerPageLayout>
  )
}

export default ProjectAnatomy
