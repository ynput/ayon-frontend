import { ScrollPanel } from '@ynput/ayon-react-components'
import ProjectManagerPageLayout from './ProjectManagerPageLayout'

import AccessGroups from '@pages/SettingsPage/AccessGroups'

const ProjectPermissions = ({ projectName, projectList }) => {
  return (
    <ProjectManagerPageLayout projectList={projectList}>
      <ScrollPanel style={{ flexGrow: 1 }} className="transparent">
        <AccessGroups projectName={projectName} />
      </ScrollPanel>
    </ProjectManagerPageLayout>
  )
}

export default ProjectPermissions
