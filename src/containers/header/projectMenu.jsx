import { useNavigate } from 'react-router-dom'
import { Button } from 'openpype-components'

import { Sidebar } from 'primereact/sidebar'
import ProjectList from '/src/containers/projectList'
import { useSelector } from 'react-redux'

const ProjectMenu = ({ visible, onHide }) => {
  const navigate = useNavigate()

  // get project context
  const context = useSelector((state) => ({ ...state.context }))
  // get current project name (id)
  const projectName = context.projectName

  const footer = (
    <Button
      icon="settings_suggest"
      label="Project manager"
      style={{ marginTop: 10, width: '100%' }}
      onClick={() => navigate('/projectManager')}
    />
  )

  return (
    <Sidebar
      position="left"
      visible={visible}
      onHide={onHide}
      icons={() => <h3>Project menu</h3>}
    >
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
          onSelect={(projectName) =>
            navigate(`/projects/${projectName}/browser`)
          }
          selection={projectName}
        />
      </div>
    </Sidebar>
  )
}

export default ProjectMenu
