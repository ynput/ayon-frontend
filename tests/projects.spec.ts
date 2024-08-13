import { projectTest } from './fixtures/newProjectFixture'
import { getProjectName } from './fixtures/project'

projectTest('create/delete project', async ({projectPage, browserName}) => {
  const projectName = getProjectName('foo')(browserName)
  await projectPage.createProject(projectName)
  await projectPage.deleteProject(projectName)
})