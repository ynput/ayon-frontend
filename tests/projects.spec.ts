import { getProjectName, projectTest } from './fixtures/projectPage'

projectTest('create/delete project', async ({projectPage, browserName}) => {
  const projectName = getProjectName('foo')(browserName)
  await projectPage.createProject(projectName)
  await projectPage.deleteProject(projectName)
})