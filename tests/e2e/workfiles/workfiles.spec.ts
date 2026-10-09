import { expect, test } from '../fixtures'
import { WorkfilesPage } from '../pages/WorkfilesPage'

test.describe('workfiles', () => {
  test('delete a workfile of a task', async ({ page, api, projectName }) => {
    const folder = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
    const task = await api.createTask(projectName, {
      folderId: folder.id,
      name: 'lighting',
      taskType: 'Lighting',
    })
    const keep = await api.createWorkfile(projectName, {
      taskId: task.id,
      path: '{root[work]}/sh010/lighting/scene_v001.ma',
    })
    const old = await api.createWorkfile(projectName, {
      taskId: task.id,
      path: '{root[work]}/sh010/lighting/scene_v002.ma',
    })

    const workfiles = new WorkfilesPage(page)
    await workfiles.goto(projectName)
    await workfiles.openTask('sh010', 'lighting')
    await expect(workfiles.row('scene_v001.ma')).toBeVisible()
    await expect(workfiles.row('scene_v002.ma')).toBeVisible()

    await workfiles.deleteWorkfile('scene_v002.ma')

    await expect(workfiles.row('scene_v002.ma')).toBeHidden()
    await expect(workfiles.row('scene_v001.ma')).toBeVisible()
    await expect.poll(() => api.workfileExists(projectName, old)).toBe(false)
    expect(await api.workfileExists(projectName, keep)).toBe(true)
  })
})
