import { expect, test } from '../fixtures'
import { AyonApi } from '../support/api'
import { OverviewPage } from '../pages/OverviewPage'
import { deleteFolder, deleteTask, graphqlResponse, LIVE_UPDATE, LiveUpdates } from './live'

/**
 * The overview is open in the admin's browser while the same project changes through the REST API,
 * i.e. from another client: the page must follow without a reload.
 */

const seed = async (api: AyonApi, projectName: string) => {
  const folder = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
  const task = await api.createTask(projectName, {
    folderId: folder.id,
    name: 'comp',
    taskType: 'Compositing',
  })
  return { folder, task }
}

/** Open the overview with sh010 expanded and its tasks loaded, once it listens to `topic` */
const openOverview = async (
  overview: OverviewPage,
  live: LiveUpdates,
  projectName: string,
  topic: string,
) => {
  // The comp row can already show from the project-wide task list before the open folder's own
  // task query has run. A change made before that query would be in its result, not a live update.
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
    // several live updates in a row, each can take up to ~11 s (see LIVE_UPDATE)
    test.slow()
    const { folder, task } = await seed(api, projectName)
    const overview = new OverviewPage(page)
    const live = new LiveUpdates(page)
    await openOverview(overview, live, projectName, 'entity.task.status_changed')
    await expect(overview.cell('comp', 'attrib_priority')).not.toContainText('High')

    await api.updateTask(projectName, task.id, { status: 'In progress' })
    await api.updateTask(projectName, task.id, { attrib: { priority: 'high' } })
    await api.updateFolder(projectName, folder.id, { status: 'On hold' })

    // status changes carry the new value, attribute changes make the page refetch the task
    await expect(overview.cell('comp', 'status')).toContainText('In progress', LIVE_UPDATE)
    await expect(overview.cell('comp', 'attrib_priority')).toContainText('High', LIVE_UPDATE)
    await expect(overview.cell('sh010', 'status')).toContainText('On hold', LIVE_UPDATE)

    // label changes carry no value either, the page refetches the task
    await api.updateTask(projectName, task.id, { label: 'Final grade' })
    await expect(overview.nameCell('Final grade')).toBeVisible(LIVE_UPDATE)
  })

  test('a folder created elsewhere appears and a deleted one disappears', async ({
    page,
    api,
    projectName,
  }) => {
    // several live updates in a row, each can take up to ~11 s (see LIVE_UPDATE)
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

  // FLAG (app bug): the overview drops `entity.task.created` events. The realtime handlers of
  // getOverviewTasksByFolders and getTasksListInfinite
  // (shared/src/api/queries/overview/getOverview.ts) only handle tasks already in their cache
  // (`if (!taskId || !cachedTaskIds.has(taskId)) return`), so a new task only shows after a
  // reload. Task progress handles the same event (src/services/tasksProgress/getTasksProgress.ts).
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

  // FLAG (backend bug): one update that changes several fields sends events that all carry the
  // value of the last one. `build_pl_entity_change_events` (ayon_server/events/patch.py) shares one
  // `summary` dict between the events and sets `summary["value"]` per event, so the
  // `status_changed` event says the status is the assignee list and the open overview shows the
  // user name as the status until a reload.
  // fixed in ynput/ayon-backend#1167, switch back to test() once it is merged
  test.fixme(
    'a status and assignee change made in one update shows the new status',
    async ({ page, api, projectName, createUser }) => {
      const artist = await createUser({ licensed: true })
      const { task } = await seed(api, projectName)
      const overview = new OverviewPage(page)
      const live = new LiveUpdates(page)
      await openOverview(overview, live, projectName, 'entity.task.status_changed')

      // one PATCH, the way a pipeline script assigns and starts a task
      await api.updateTask(projectName, task.id, {
        status: 'In progress',
        assignees: [artist.name],
      })

      await expect(overview.cell('comp', 'status')).toContainText('In progress', LIVE_UPDATE)
      await expect(overview.cell('comp', 'status')).not.toContainText(artist.name)
    },
  )
})
