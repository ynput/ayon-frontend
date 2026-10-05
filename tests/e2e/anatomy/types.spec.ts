import { expect, test } from '../fixtures'
import { OverviewPage } from '../pages/OverviewPage'
import { ProjectsManagerPage } from '../pages/ProjectsManagerPage'
import { TasksProgressPage } from '../pages/TasksProgressPage'

// Every test changes the anatomy of its own project only (the `projectName` fixture).

/** Opens the project anatomy with one section expanded */
const openSection = async (manager: ProjectsManagerPage, projectName: string, title: string) => {
  await manager.goto('anatomy', projectName)
  await manager.anatomy.expand(title)
}

test.describe('project anatomy: folder and task types', () => {
  test('a task type added in the anatomy can be picked when creating a task', async ({
    page,
    api,
    projectName,
  }) => {
    const folder = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
    const index = (await api.getProject(projectName)).taskTypes.length
    const item = `root_task_types_${index}`
    const manager = new ProjectsManagerPage(page)
    await openSection(manager, projectName, 'Task types')

    await manager.anatomy.addItem('root_task_types')
    await manager.anatomy.fillText(`${item}_name`, 'Grooming')
    await manager.anatomy.fillText(`${item}_shortName`, 'grm')
    await manager.anatomy.pickIcon(`${item}_icon`, 'content_cut')
    await manager.saveAnatomy()
    await expect
      .poll(async () => (await api.getProject(projectName)).taskTypes[index])
      .toMatchObject({ name: 'Grooming', shortName: 'grm', icon: 'content_cut' })

    const overview = new OverviewPage(page)
    await overview.goto(projectName)
    await overview.selectRow('sh010')
    await overview.createTask({ label: 'groom', type: 'Grooming' })

    await overview.expand('sh010')
    // the type column shows the new type with its icon
    await expect(overview.cell('groom', 'subType')).toContainText('Grooming')
    await expect(overview.cell('groom', 'subType').getByText('content_cut')).toBeVisible()
    await expect
      .poll(async () =>
        (await api.listTasks(projectName, folder.id)).map((t) => [t.name, t.taskType]),
      )
      .toEqual([['groom', 'Grooming']])
  })

  test('a folder type added in the anatomy can be picked when creating a folder', async ({
    page,
    api,
    projectName,
  }) => {
    const index = (await api.getProject(projectName)).folderTypes.length
    const item = `root_folder_types_${index}`
    const manager = new ProjectsManagerPage(page)
    await openSection(manager, projectName, 'Folder types')

    await manager.anatomy.addItem('root_folder_types')
    await manager.anatomy.fillText(`${item}_name`, 'Environment')
    await manager.anatomy.pickIcon(`${item}_icon`, 'forest')
    await manager.saveAnatomy()
    await expect
      .poll(async () => (await api.getProject(projectName)).folderTypes[index])
      .toMatchObject({ name: 'Environment', icon: 'forest' })

    const overview = new OverviewPage(page)
    await overview.goto(projectName)
    await overview.createFolder({ label: 'Jungle', type: 'Environment' })

    await expect(overview.cell('Jungle', 'subType')).toContainText('Environment')
    await expect(overview.cell('Jungle', 'subType').getByText('forest')).toBeVisible()
    await expect
      .poll(async () =>
        (await api.listFolders(projectName)).map((f) => [f.label ?? f.name, f.folderType]),
      )
      .toEqual([['Jungle', 'Environment']])
  })

  test('renaming a task type renames it on the tasks that have it', async ({
    page,
    api,
    projectName,
  }) => {
    const folder = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
    const task = await api.createTask(projectName, {
      folderId: folder.id,
      name: 'anim',
      taskType: 'Animation',
    })
    const index = (await api.getProject(projectName)).taskTypes.findIndex(
      (t: { name: string }) => t.name === 'Animation',
    )
    const manager = new ProjectsManagerPage(page)
    await openSection(manager, projectName, 'Task types')

    await manager.anatomy.fillText(`root_task_types_${index}_name`, 'Keyframing')
    await manager.saveAnatomy()

    await expect
      .poll(async () => (await api.getTask(projectName, task.id)).taskType)
      .toBe('Keyframing')
    const taskTypes = (await api.getProject(projectName)).taskTypes.map(
      (t: { name: string }) => t.name,
    )
    expect(taskTypes.indexOf('Keyframing')).toBe(index)
    expect(taskTypes).not.toContain('Animation')
    // task progress has a column per task type
    const progress = new TasksProgressPage(page)
    await progress.goto(projectName)
    await progress.selectFolder('sh010')
    await expect(page.getByRole('columnheader', { name: /Keyframing/ })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /Animation/ })).toBeHidden()
    await expect(progress.taskCell('sh010', 'anim')).toBeVisible()
  })
})
