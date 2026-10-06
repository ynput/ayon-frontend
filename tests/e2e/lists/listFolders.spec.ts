import { expect, test } from '../fixtures'
import { hasPowerpack, ListsPage } from '../pages/ListsPage'
import { confirmDialog } from '../support/ui'

/** List folders group lists in the lists panel. They are a powerpack feature. */
test.describe('list folders', () => {
  test.beforeEach(async ({ api }) => {
    test.skip(!(await hasPowerpack(api)), 'list folders need the powerpack addon')
  })

  test('create a folder for the selected lists', async ({ page, api, projectName }) => {
    const mondayId = await api.createEntityList(projectName, { label: 'Monday picks' })
    const tuesdayId = await api.createEntityList(projectName, { label: 'Tuesday picks' })
    await api.createEntityList(projectName, { label: 'Client notes' })
    const lists = new ListsPage(page)
    await lists.goto(projectName)
    await lists.selectListRow('Monday picks')
    await lists.selectListRow('Tuesday picks', { add: true })

    await lists.headerMenu('Create folder')
    await lists.submitFolderDialog('Dailies', 'Create Folder for 2 Lists')

    await expect(lists.listRow('Dailies')).toBeVisible()
    await expect
      .poll(() => api.listEntityListFolders(projectName))
      .toEqual([{ id: expect.any(String), label: 'Dailies', parentId: null }])
    const [folder] = await api.listEntityListFolders(projectName)
    await expect
      .poll(async () =>
        Promise.all(
          [mondayId, tuesdayId].map(
            async (id) => (await api.getEntityList(projectName, id)).entityListFolderId,
          ),
        ),
      )
      .toEqual([folder.id, folder.id])
    // the new folder opens with the lists inside it; collapsing it hides them
    await lists.setFolderExpanded('Dailies', false)
    await expect(lists.listRow('Monday picks')).toBeHidden()
    await expect(lists.listRow('Tuesday picks')).toBeHidden()
    await expect(lists.listRow('Client notes')).toBeVisible()
  })

  test('move a list into a folder', async ({ page, api, projectName }) => {
    const folderId = await api.createEntityListFolder(projectName, { label: 'Dailies' })
    const listId = await api.createEntityList(projectName, { label: 'Monday picks' })
    await api.createEntityList(projectName, { label: 'Client notes' })
    const lists = new ListsPage(page)
    await lists.goto(projectName)
    await expect(lists.listRow('Monday picks')).toBeVisible()

    await lists.rowMenu('Monday picks', 'Move list')
    await lists.moveTo('Dailies')

    await expect
      .poll(async () => (await api.getEntityList(projectName, listId)).entityListFolderId)
      .toBe(folderId)
    await lists.setFolderExpanded('Dailies', true)
    await expect(lists.listRow('Monday picks')).toBeVisible()
    await lists.setFolderExpanded('Dailies', false)
    await expect(lists.listRow('Monday picks')).toBeHidden()
    await expect(lists.listRow('Client notes')).toBeVisible()
  })

  test('create a subfolder', async ({ page, api, projectName }) => {
    const parentId = await api.createEntityListFolder(projectName, { label: 'Season 1' })
    const lists = new ListsPage(page)
    await lists.goto(projectName)

    await lists.rowMenu('Season 1', 'Create subfolder')
    await lists.submitFolderDialog('Episode 101', 'Create Folder in: Season 1')

    await expect(lists.listRow('Episode 101')).toBeVisible()
    await expect
      .poll(async () =>
        (await api.listEntityListFolders(projectName)).map((f) => [f.label, f.parentId]),
      )
      .toEqual(expect.arrayContaining([['Episode 101', parentId]]))
  })

  test('move a folder into another folder', async ({ page, api, projectName }) => {
    const seasonId = await api.createEntityListFolder(projectName, { label: 'Season 1' })
    const episodeId = await api.createEntityListFolder(projectName, { label: 'Episode 101' })
    const lists = new ListsPage(page)
    await lists.goto(projectName)
    await expect(lists.listRow('Episode 101')).toBeVisible()

    await lists.rowMenu('Episode 101', 'Move folder')
    await lists.moveTo('Season 1')

    await expect
      .poll(
        async () =>
          (await api.listEntityListFolders(projectName)).find((f) => f.id === episodeId)?.parentId,
      )
      .toBe(seasonId)
    await lists.setFolderExpanded('Season 1', false)
    await expect(lists.listRow('Episode 101')).toBeHidden()
  })

  test('create a list inside a folder', async ({ page, api, projectName }) => {
    const folderId = await api.createEntityListFolder(projectName, { label: 'Dailies' })
    const lists = new ListsPage(page)
    await lists.goto(projectName)

    await lists.rowMenu('Dailies', 'Create list')
    await lists.submitNewListDialog({ label: 'Monday picks' })

    // the new list is selected, but a collapsed folder stays collapsed
    await expect(lists.listRow('Dailies')).toContainText('1')
    await lists.setFolderExpanded('Dailies', true)
    await expect(lists.listRow('Monday picks')).toBeVisible()
    await expect
      .poll(async () => {
        const [list] = await api.listEntityLists(projectName)
        return list && (await api.getEntityList(projectName, list.id)).entityListFolderId
      })
      .toBe(folderId)
  })

  // FLAG (app bug): searching the lists panel keeps folders collapsed, so a matching list inside a
  // collapsed folder stays hidden and only its folder row is shown. ListsTable passes the search as
  // `globalFilter` (ListsTable.tsx:155) but keeps the user's `expanded` state (ListsTable.tsx:114);
  // the projects list flattens folders while searching instead (ProjectsList.tsx:97).
  // switch back to test() once search shows matches inside folders
  test.fixme('search finds lists inside collapsed folders', async ({ page, api, projectName }) => {
    const folderId = await api.createEntityListFolder(projectName, { label: 'Dailies' })
    const listId = await api.createEntityList(projectName, { label: 'Monday picks' })
    await api.updateEntityList(projectName, listId, { entityListFolderId: folderId })
    await api.createEntityList(projectName, { label: 'Client notes' })
    const lists = new ListsPage(page)
    await lists.goto(projectName)
    await expect(lists.listRow('Client notes')).toBeVisible()
    await expect(lists.folderExpander('Dailies')).toHaveText('chevron_right')

    await lists.search('Monday')

    await expect(lists.listRow('Monday picks')).toBeVisible()
    await expect(lists.listRow('Client notes')).toBeHidden()
  })

  test('rename a folder', async ({ page, api, projectName }) => {
    const folderId = await api.createEntityListFolder(projectName, { label: 'Dailies' })
    const lists = new ListsPage(page)
    await lists.goto(projectName)

    await lists.rowMenu('Dailies', 'Rename folder')
    // the folder row turns into an input
    const input = page.getByRole('row').getByRole('textbox')
    await expect(input).toBeFocused()
    await input.fill('Dailies archive')
    await input.press('Enter')

    await expect(lists.listRow('Dailies archive')).toBeVisible()
    await expect
      .poll(async () => (await api.listEntityListFolders(projectName)).map((f) => [f.id, f.label]))
      .toEqual([[folderId, 'Dailies archive']])
  })

  test('deleting a folder keeps its lists', async ({ page, api, projectName }) => {
    const folderId = await api.createEntityListFolder(projectName, { label: 'Dailies' })
    const listId = await api.createEntityList(projectName, { label: 'Monday picks' })
    await api.updateEntityList(projectName, listId, { entityListFolderId: folderId })
    const lists = new ListsPage(page)
    await lists.goto(projectName)
    await expect(lists.listRow('Dailies')).toBeVisible()

    await lists.rowMenu('Dailies', 'Delete (folder only)')
    await confirmDialog(page).getByRole('button', { name: 'Delete' }).click()

    await expect(lists.listRow('Dailies')).toBeHidden()
    await expect(lists.listRow('Monday picks')).toBeVisible()
    await expect.poll(() => api.listEntityListFolders(projectName)).toEqual([])
    expect((await api.getEntityList(projectName, listId)).entityListFolderId).toBeNull()
  })
})
