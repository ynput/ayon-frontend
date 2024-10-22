import React from 'react'
import PropTypes from 'prop-types'
import ProjectList from '@containers/projectList'

// Wraps every page on projectManager and provides the project list
// and other useful props
const ProjectManagerPageContainer = ({
  children,
  isUser,
  selection,
  onDeleteProject,
  onNewProject,
  onActivateProject,
  ...props
}) => {
  // for each child, add the project list react node with the props
  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        projectManager: true,
        projectName: selection,
        isUser: isUser,
        projectList: (
          <ProjectList
            styleSection={{ maxWidth: 300, minWidth: 300 }}
            autoSelect
            selection={selection}
            onDeleteProject={onDeleteProject}
            onActivateProject={onActivateProject}
            onNewProject={onNewProject}
            isProjectManager={!isUser}
            {...props}
          />
        ),
        onDeleteProject,
        onNewProject,
        onActivateProject,
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
