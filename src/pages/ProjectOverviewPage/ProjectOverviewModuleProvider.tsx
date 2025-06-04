import { FC } from 'react'
import { ProjectTableModuleProvider } from '@shared/containers/ProjectTreeTable'
import ProjectOverviewDataProvider from './ProjectOverviewDataProvider'

const ProjectOverviewModuleProvider: FC = () => {
  return (
    <ProjectTableModuleProvider>
      <ProjectOverviewDataProvider />
    </ProjectTableModuleProvider>
  )
}

export default ProjectOverviewModuleProvider
