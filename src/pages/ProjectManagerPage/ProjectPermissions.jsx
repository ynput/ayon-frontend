import ProjectManagerPageLayout from './ProjectManagerPageLayout'

import AccessGroups from '@pages/SettingsPage/AccessGroups'

const ProjectPermissions = ({ projectName, projectList }) => {
  return (
    <ProjectManagerPageLayout projectList={projectList}>
      <AccessGroups projectName={projectName} />
    </ProjectManagerPageLayout>
  )
}

export default ProjectPermissions
