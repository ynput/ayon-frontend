import { Locator } from '@playwright/test'
import { expect, test } from './restrictedUser'
import { AyonApi } from '../support/api'
import { OverviewPage } from '../pages/OverviewPage'
import { apiAs, signInAs } from '../support/session'

/** A shot with a comp task */
const createShot = async (api: AyonApi, projectName: string, taskData = {}) => {
  const folder = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
  const task = await api.createTask(projectName, {
    folderId: folder.id,
    name: 'comp',
    taskType: 'Compositing',
    ...taskData,
  })
  return { folder, task }
}

/** Show these overview columns to the user (views are stored per user) */
const showColumns = async (userApi: AyonApi, projectName: string, columns: string[]) =>
  userApi.setWorkingViewColumns('overview', projectName, ['name', ...columns])

/**
 * The lock icon of a read-only column header.
 * FLAG: the icon has no accessible name, its meaning is only in its tooltip.
 */
const readOnlyLock = (header: Locator) =>
  header.locator('[data-tooltip="You only have permission to read this column."]')

/**
 * The widget of an overview cell. Its class tells whether the cell can be edited.
 * FLAG: editability is only exposed as the `editable` / `readonly` class of the cell widget.
 */
const cellWidget = (overview: OverviewPage, label: string, columnId: string) =>
  overview.cell(label, columnId).locator('.editable, .readonly')

/** May write FPS and the status, nothing else */
const FPS_AND_STATUS = { attrib_write: { enabled: true, attributes: ['fps'], fields: ['status'] } }

test.describe('permissions: attribute access', () => {
  test('attributes the user may not write are locked in the overview', async ({
    api,
    projectName,
    restrictedUser,
    browser,
  }, testInfo) => {
    const user = await restrictedUser(FPS_AND_STATUS)
    const { task } = await createShot(api, projectName)
    const userApi = await apiAs(testInfo, user.name, user.password)
    await showColumns(userApi, projectName, ['status', 'attrib_fps', 'attrib_resolutionWidth'])
    const { context, page } = await signInAs(browser, user.name, user.password)
    try {
      const overview = new OverviewPage(page)
      await overview.goto(projectName)
      await overview.expand('sh010')

      await expect(readOnlyLock(overview.columnHeader('attrib_resolutionWidth'))).toBeVisible()
      await expect(cellWidget(overview, 'comp', 'attrib_resolutionWidth')).toHaveClass(
        /\breadonly\b/,
      )
      await expect(readOnlyLock(overview.columnHeader('attrib_fps'))).toHaveCount(0)
      await expect(readOnlyLock(overview.columnHeader('status'))).toHaveCount(0)
      await expect(cellWidget(overview, 'comp', 'status')).toHaveClass(/\beditable\b/)

      // the allowed attribute can be edited
      await overview.editTextCell('comp', 'attrib_fps', '48')
      await expect(overview.cell('comp', 'attrib_fps')).toHaveText('48')
      await expect.poll(async () => (await api.getTask(projectName, task.id)).attrib.fps).toBe(48)

      // the lock matches the server, which refuses the other attribute
      await expect(
        userApi.updateTask(projectName, task.id, { attrib: { resolutionWidth: 1234 } }),
      ).rejects.toThrow(/failed with 403/)
      expect((await api.getTask(projectName, task.id)).attrib.resolutionWidth).toBe(1920)
    } finally {
      await userApi.dispose()
      await context.close()
    }
  })

  // FLAG (frontend): the details panel ignores `attrib_write`. Every attribute and built-in field is
  // editable there and the server answers 403 ("You are not allowed to modify resolutionWidth
  // attribute ..."), while the overview locks the same columns. `useEntityFields` builds the fields
  // without the project permissions and `useEntityEditing` hard-codes `enableEditing = true`
  // (shared/src/components/DetailsPanelDetails/hooks/).
  test.fixme(
    'attributes the user may not write are read-only in the details panel',
    async ({ api, projectName, restrictedUser, browser }) => {
      const user = await restrictedUser(FPS_AND_STATUS)
      const { task } = await createShot(api, projectName)
      const { context, page } = await signInAs(browser, user.name, user.password)
      try {
        const overview = new OverviewPage(page)
        await overview.goto(projectName)
        await overview.expand('sh010')
        const panel = await overview.openDetails('comp')
        await panel.openTab('details')

        await expect(panel.attribute('Width')).toHaveClass(/\breadonly\b/)
        await expect(panel.attribute('FPS')).not.toHaveClass(/\breadonly\b/)

        await panel.setAttribute('FPS', '48')
        await expect.poll(async () => (await api.getTask(projectName, task.id)).attrib.fps).toBe(48)
        expect((await api.getTask(projectName, task.id)).attrib.resolutionWidth).toBe(1920)
      } finally {
        await context.close()
      }
    },
  )

  // FLAG (frontend): with "Restrict attribute update" enabled and no field switch on, the server
  // refuses every field change (status, name, type, assignees, ...), but the overview treats an
  // empty field list as "no restriction" and offers them all; saving then fails with
  // "Failed to update task". `getReadOnlyLists` checks `writableFields?.length` and
  // `useAttributeFields` passes `attrib_write.fields` without looking at `attrib_write.enabled`
  // (shared/src/containers/ProjectTreeTable/utils/getReadOnlyLists.ts,
  // shared/src/containers/ProjectTreeTable/hooks/useAttributesList.ts).
  test.fixme(
    'built-in fields are locked when the access group allows none of them',
    async ({ api, projectName, restrictedUser, browser }, testInfo) => {
      const user = await restrictedUser({
        attrib_write: { enabled: true, attributes: ['fps'], fields: [] },
      })
      const { task } = await createShot(api, projectName)
      const userApi = await apiAs(testInfo, user.name, user.password)
      await showColumns(userApi, projectName, ['status', 'attrib_fps'])
      const { context, page } = await signInAs(browser, user.name, user.password)
      try {
        const overview = new OverviewPage(page)
        await overview.goto(projectName)
        await overview.expand('sh010')

        await expect(readOnlyLock(overview.columnHeader('status'))).toBeVisible()
        await expect(cellWidget(overview, 'comp', 'status')).toHaveClass(/\breadonly\b/)
        await expect(cellWidget(overview, 'comp', 'attrib_fps')).toHaveClass(/\beditable\b/)

        // the server allows no field change
        await expect(
          userApi.updateTask(projectName, task.id, { status: 'In progress' }),
        ).rejects.toThrow(/failed with 403/)
        expect((await api.getTask(projectName, task.id)).status).toBe('Not ready')
      } finally {
        await userApi.dispose()
        await context.close()
      }
    },
  )

  // FLAG (backend): when a user has several access groups that restrict attribute updates, only the
  // fields of the last group are kept: `AccessGroups.combine` merges `attrib_write.fields` from
  // `result[perm_name].get("can_create", [])` instead of `"fields"`
  // (ayon-backend ayon_server/access/access_groups.py). Here the user may change the status through
  // the first group, yet the server reports only "tags" as writable, so the overview locks the
  // status column and the server refuses the change.
  test.fixme(
    'a user in two access groups may change the fields either group allows',
    async ({ api, projectName, restrictedUser, browser }, testInfo) => {
      const user = await restrictedUser([
        { attrib_write: { enabled: true, attributes: [], fields: ['status'] } },
        { attrib_write: { enabled: true, attributes: [], fields: ['tags'] } },
      ])
      const { task } = await createShot(api, projectName)
      const userApi = await apiAs(testInfo, user.name, user.password)
      await showColumns(userApi, projectName, ['status'])
      const { context, page } = await signInAs(browser, user.name, user.password)
      try {
        const overview = new OverviewPage(page)
        await overview.goto(projectName)
        await overview.expand('sh010')
        await expect(cellWidget(overview, 'comp', 'status')).toHaveClass(/\beditable\b/)

        await overview.setEnumCell('comp', 'status', 'In progress')

        await expect(overview.cell('comp', 'status')).toContainText('In progress')
        await expect
          .poll(async () => (await api.getTask(projectName, task.id)).status)
          .toBe('In progress')
      } finally {
        await userApi.dispose()
        await context.close()
      }
    },
  )

  test('attributes the user may not read are not shown', async ({
    api,
    projectName,
    restrictedUser,
    browser,
  }, testInfo) => {
    const user = await restrictedUser({ attrib_read: { enabled: true, attributes: ['fps'] } })
    const { task } = await createShot(api, projectName, { attrib: { resolutionWidth: 4321 } })
    const userApi = await apiAs(testInfo, user.name, user.password)
    // the user asks for the column, but may not read it
    await showColumns(userApi, projectName, ['attrib_fps', 'attrib_resolutionWidth'])
    const { context, page } = await signInAs(browser, user.name, user.password)
    try {
      const overview = new OverviewPage(page)
      await overview.goto(projectName)
      await overview.expand('sh010')
      await expect(overview.cell('comp', 'attrib_fps')).toHaveText('25')
      await expect(overview.columnHeader('attrib_resolutionWidth')).toHaveCount(0)

      const panel = await overview.openDetails('comp')
      await panel.openTab('details')
      await expect(panel.attribute('FPS')).toContainText('25')
      await expect(page.getByText('4321')).toHaveCount(0)

      // the server does not send the value to the user
      expect((await userApi.getTask(projectName, task.id)).attrib.resolutionWidth).toBeUndefined()
      expect((await api.getTask(projectName, task.id)).attrib.resolutionWidth).toBe(4321)
    } finally {
      await userApi.dispose()
      await context.close()
    }
  })
})
