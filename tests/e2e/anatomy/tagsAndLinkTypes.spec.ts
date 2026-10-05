import { expect, test } from '../fixtures'
import { OverviewPage } from '../pages/OverviewPage'
import { ProjectsManagerPage } from '../pages/ProjectsManagerPage'

// Every test changes the anatomy of its own project only (the `projectName` fixture).

test.describe('project anatomy: tags and link types', () => {
  test('a tag added in the anatomy is offered in the tag editor of a task', async ({
    page,
    api,
    projectName,
  }) => {
    const folder = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
    const task = await api.createTask(projectName, { folderId: folder.id, name: 'anim' })
    const index = (await api.getProject(projectName)).tags.length
    const manager = new ProjectsManagerPage(page)
    await manager.goto('anatomy', projectName)
    await manager.anatomy.expand('Tags')

    await manager.anatomy.addItem('root_tags')
    await manager.anatomy.fillText(`root_tags_${index}_name`, 'client approved')
    await manager.anatomy.setColor(`root_tags_${index}_color`, '#1e90ff')
    await manager.saveAnatomy()

    await expect
      .poll(async () => (await api.getProject(projectName)).tags[index])
      .toMatchObject({ name: 'client approved', color: '#1e90ff' })
    await api.setWorkingViewColumns('overview', projectName, ['name', 'tags'])
    const overview = new OverviewPage(page)
    await overview.goto(projectName)
    await overview.expand('sh010')
    await overview.setEnumCell('anim', 'tags', 'client approved')
    // tags are a multi select, the dropdown stays open until it is closed
    await page.keyboard.press('Escape')
    await expect(page.locator('.options')).toBeHidden()

    await expect(overview.cell('anim', 'tags')).toContainText('client approved')
    await expect
      .poll(async () => (await api.getTask(projectName, task.id)).tags)
      .toEqual(['client approved'])
  })

  test('a link type added in the anatomy can be shown as overview columns', async ({
    page,
    api,
    projectName,
  }) => {
    const index = (await api.getProject(projectName)).linkTypes.length
    const item = `root_link_types_${index}`
    await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
    const manager = new ProjectsManagerPage(page)
    await manager.goto('anatomy', projectName)
    await manager.anatomy.expand('Link types')

    await manager.anatomy.addItem('root_link_types')
    await manager.anatomy.fillText(`${item}_link_type`, 'depends')
    await manager.anatomy.select(`${item}_input_type`, 'folder')
    await manager.anatomy.select(`${item}_output_type`, 'task')
    await manager.saveAnatomy()

    await expect
      .poll(async () => (await api.getProject(projectName)).linkTypes.map((l: any) => l.name))
      .toContain('depends|folder|task')
    const overview = new OverviewPage(page)
    await overview.goto(projectName)
    // one column per direction, in the "Links" submenu of the column picker
    await overview.showColumn('Depends (in)', 'Links')

    await expect(overview.columnHeader('link_depends_folder_task_in')).toBeVisible()
    await expect(overview.columnHeader('link_depends_folder_task_in')).toContainText('Depends (in)')
  })
})
