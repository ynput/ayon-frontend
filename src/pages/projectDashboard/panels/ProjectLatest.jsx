import React from 'react'
import DashboardPanelWrapper from './DashboardPanelWrapper'
import ProjectLatestRow from './ProjectLatestRow'

const ProjectLatest = ({ projectName }) => {
  return (
    <DashboardPanelWrapper
      title="Latest"
      link={{
        link: '/events',
        icon: 'history',
      }}
    >
      <h2>Recent Activity</h2>
      <ProjectLatestRow
        projectName={projectName}
        types={['subset', 'version', 'folder', 'task']}
        events={['created', 'attrib_changed', 'tags_changed']}
        banTopics={['entity.version.created']}
      />
      <h2>New Versions</h2>
      <ProjectLatestRow projectName={projectName} types={['version']} events={['created']} />
      <h2>Status Changes</h2>
      <ProjectLatestRow
        projectName={projectName}
        types={['subset', 'version', 'folder', 'task']}
        events={['status_changed']}
      />
    </DashboardPanelWrapper>
  )
}

export default ProjectLatest
