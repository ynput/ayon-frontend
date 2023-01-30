import { useNavigate } from 'react-router-dom'
import { Button } from '@ynput/ayon-react-components'

import { Sidebar } from 'primereact/sidebar'
import ProjectList from '/src/containers/projectList'
import { useDispatch, useSelector } from 'react-redux'
import { projectSelected } from '/src/features/context'

const ProjectMenu = ({ visible, onHide }) => {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const projectName = useSelector((state) => state.context.projectName)

  const onProjectSelect = (projectName) => {
    // reset selected folders
    dispatch(projectSelected())
    navigate(`/projects/${projectName}/browser`)
  }

  const footer = (
    <Button
      icon="settings_suggest"
      label="Manage Projects"
      style={{ marginTop: 10, width: '100%' }}
      onClick={() => navigate('/manageProjects')}
    />
  )

  return (
    <Sidebar position="left" visible={visible} onHide={onHide} icons={() => <h3>Project menu</h3>}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          width: '100%',
          height: '100%',
        }}
      >
        <ProjectList
          footer={footer}
          onSelect={(projectName) => onProjectSelect(projectName)}
          selection={projectName}
        />
      </div>
    </Sidebar>
  )
}

export default ProjectMenu
