import React from 'react'
import PropTypes from 'prop-types'
import ProjectList from '/src/containers/projectList'
import { Button } from '@ynput/ayon-react-components'
import { useNavigate } from 'react-router'

const ProjectManagerPageContainer = ({
  children,
  isUser,
  selection,
  onDeleteProject,
  onNewProject,
  ...props
}) => {
  const navigate = useNavigate()
  // for each child, add the project list react node with the props
  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        projectManager: true,
        projectName: selection,
        isUser: isUser,
        projectList: (
          <ProjectList
            style={{ minWidth: 100 }}
            styleSection={{ maxWidth: 150, minWidth: 150 }}
            hideCode
            autoSelect
            onRowDoubleClick={(e) => navigate(`/projects/${e.data.name}/browser`)}
            selection={selection}
            {...props}
          />
        ),
        toolbar: (
          <>
            {!isUser && (
              <>
                <Button label="New project" icon="create_new_folder" onClick={onNewProject} />

                <Button
                  label="Delete project"
                  icon="delete"
                  className="p-button-danger"
                  disabled={!selection}
                  onClick={onDeleteProject}
                />
              </>
            )}
          </>
        ),
      })
    }
    return child
  })

  return <>{childrenWithProps}</>
}

ProjectManagerPageContainer.propTypes = {
  children: PropTypes.node,
  isUser: PropTypes.bool,
  onSuccess: PropTypes.func,
  onNoProject: PropTypes.func,
  onSelect: PropTypes.func,
  selection: PropTypes.string,
  onDeleteProject: PropTypes.func,
  onNewProject: PropTypes.func,
}

export default ProjectManagerPageContainer
