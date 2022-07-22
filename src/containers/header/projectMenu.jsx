import { useNavigate } from 'react-router-dom'

import { Button } from '/src/components'
import { Sidebar } from 'primereact/sidebar'
import ProjectList from '/src/containers/projectList'

const ProjectMenu = ({ visible, onHide }) => {
  const navigate = useNavigate()

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
          onSelect={(projectName) => navigate(`/projects/${projectName}/browser`)}
        />
        <Button
          icon="settings_suggest"
          label="Project manager"
          style={{ marginTop: 10 }}
          onClick={() => navigate('/projects')}
        />
      </div>
    </Sidebar>
  )
}

export default ProjectMenu
