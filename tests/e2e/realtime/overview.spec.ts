import { expect, test } from '../fixtures'
import { AyonApi } from '../support/api'
import { OverviewPage } from '../pages/OverviewPage'
import { deleteFolder, deleteTask, graphqlResponse, LIVE_UPDATE, LiveUpdates } from './live'

const seed = async (api: AyonApi, projectName: string) => {
  const folder = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
  const task = await api.createTask(projectName, {
    folderId: folder.id,
    name: 'comp',
    taskType: 'Compositing',
  })
  return { folder, task }
}

const openOverview = async (
  overview: OverviewPage,
  live: LiveUpdates,
  projectName: string,
  topic: string,
) => {
  // the row can show before GetTasksByParent ran, and a change made before it is not a live update
  const folderTasksLoaded = graphqlResponse(overview.page, 'GetTasksByParent')
  await overview.goto(projectName)
  await overview.expand('sh010')
  await folderTasksLoaded
  await expect(overview.cell('comp', 'status')).toContainText('Not ready')
  await live.expectSubscribed(topic, projectName)
}

test.describe('overview live updates', () => {
  test('status and attribute changes made elsewhere show in the open overview', async ({
    page,
    api,
    projectName,
  }) => {
    test.slow()
    const { folder, task } = await seed(api, projectName)
    const overview = new OverviewPage(page)
    const live = new LiveUpdates(page)
    await openOverview(overview, live, projectName, 'entity.task.status_changed')
    await expect(overview.cell('comp', 'attrib_priority')).not.toContainText('High')

    await api.updateTask(projectName, task.id, { status: 'In progress' })
    await api.updateTask(projectName, task.id, { attrib: { priority: 'high' } })
    await api.updateFolder(projectName, folder.id, { status: 'On hold' })

    await expect(overview.cell('comp', 'status')).toContainText('In progress', LIVE_UPDATE)
    await expect(overview.cell('comp', 'attrib_priority')).toContainText('High', LIVE_UPDATE)
    await expect(overview.cell('sh010', 'status')).toContainText('On hold', LIVE_UPDATE)

    await api.updateTask(projectName, task.id, { label: 'Final grade' })
    await expect(overview.nameCell('Final grade')).toBeVisible(LIVE_UPDATE)
  })

  test('a folder created elsewhere appears and a deleted one disappears', async ({
    page,
    api,
    projectName,
  }) => {
    test.slow()
    const { folder } = await seed(api, projectName)
    const overview = new OverviewPage(page)
    const live = new LiveUpdates(page)
    await openOverview(overview, live, projectName, 'entity.folder.created')
    await expect(overview.nameCell('sh020')).toBeHidden()

    await api.createFolder(projectName, { name: 'sh020', folderType: 'Shot' })

    await expect(overview.nameCell('sh020')).toBeVisible(LIVE_UPDATE)

    await deleteFolder(api, projectName, folder.id)

    await expect(overview.nameCell('sh010')).toBeHidden(LIVE_UPDATE)
    await expect(overview.nameCell('comp')).toBeHidden()
    await expect(overview.nameCell('sh020')).toBeVisible()
  })

  test('a task deleted elsewhere disappears from the open overview', async ({
    page,
    api,
    projectName,
  }) => {
    const { folder, task } = await seed(api, projectName)
    await api.createTask(projectName, { folderId: folder.id, name: 'anim', taskType: 'Animation' })
    const overview = new OverviewPage(page)
    const live = new LiveUpdates(page)
    await openOverview(overview, live, projectName, 'entity.task.deleted')
    await expect(overview.nameCell('anim')).toBeVisible()

    await deleteTask(api, projectName, task.id)

    await expect(overview.nameCell('comp')).toBeHidden(LIVE_UPDATE)
    await expect(overview.nameCell('anim')).toBeVisible()
  })

  // FLAG (app bug): the overview's realtime handlers skip tasks not in their cache; new tasks need a reload
  // fixed in ynput/ayon-frontend#2412, switch back to test() once it is merged
  test.fixme(
    'a task created elsewhere appears in its open folder',
    async ({ page, api, projectName }) => {
      const { folder } = await seed(api, projectName)
      const overview = new OverviewPage(page)
      const live = new LiveUpdates(page)
      await openOverview(overview, live, projectName, 'entity.task.created')

      await api.createTask(projectName, { folderId: folder.id, name: 'paint', taskType: 'Paint' })

      await expect(overview.nameCell('paint')).toBeVisible(LIVE_UPDATE)
    },
  )

  // FLAG (backend bug): a multi-field update sends events that all carry the last field's value
  // fixed in ynput/ayon-backend#1167, switch back to test() once it is merged
  test.fixme(
    'a status and assignee change made in one update shows the new status',
    async ({ page, api, projectName, createUser }) => {
      const artist = await createUser({ licensed: true })
      const { task } = await seed(api, projectName)
      const overview = new OverviewPage(page)
      const live = new LiveUpdates(page)
      await openOverview(overview, live, projectName, 'entity.task.status_changed')

      await api.updateTask(projectName, task.id, {
        status: 'In progress',
        assignees: [artist.name],
      })

      await expect(overview.cell('comp', 'status')).toContainText('In progress', LIVE_UPDATE)
      await expect(overview.cell('comp', 'status')).not.toContainText(artist.name)
    },
  )
})
