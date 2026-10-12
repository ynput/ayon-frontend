import { Locator } from '@playwright/test'
import { expect, test } from './restrictedUser'
import { AyonApi } from '../support/api'
import { OverviewPage } from '../pages/OverviewPage'
import { apiAs, signInAs } from '../support/session'

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

const showColumns = async (userApi: AyonApi, projectName: string, columns: string[]) =>
  userApi.setWorkingViewColumns('overview', projectName, ['name', ...columns])

// FLAG: the lock icon has no accessible name, its meaning is only in its tooltip
const readOnlyLock = (header: Locator) =>
  header.locator('[data-tooltip="You only have permission to read this column."]')

// FLAG: editability is only exposed as the `editable` / `readonly` class of the cell widget
const cellWidget = (overview: OverviewPage, label: string, columnId: string) =>
  overview.cell(label, columnId).locator('.editable, .readonly')

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

      await overview.editTextCell('comp', 'attrib_fps', '48')
      await expect(overview.cell('comp', 'attrib_fps')).toHaveText('48')
      await expect.poll(async () => (await api.getTask(projectName, task.id)).attrib.fps).toBe(48)

      await expect(
        userApi.updateTask(projectName, task.id, { attrib: { resolutionWidth: 1234 } }),
      ).rejects.toThrow(/failed with 403/)
      expect((await api.getTask(projectName, task.id)).attrib.resolutionWidth).toBe(1920)
    } finally {
      await userApi.dispose()
      await context.close()
    }
  })

  // FLAG (frontend): the details panel ignores `attrib_write`; every field is editable, saving gets a 403
  // fixed in ynput/ayon-frontend#2403, switch back to test() once it is merged
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

  // FLAG (frontend): the overview reads an empty attrib_write.fields as "no restriction", all look editable
  // fixed in ynput/ayon-frontend#2404, switch back to test() once it is merged
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

  // FLAG (backend): AccessGroups.combine merges attrib_write.fields from "can_create"; the last group wins
  // fixed in ynput/ayon-backend#1165, switch back to test() once it is merged
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

      expect((await userApi.getTask(projectName, task.id)).attrib.resolutionWidth).toBeUndefined()
      expect((await api.getTask(projectName, task.id)).attrib.resolutionWidth).toBe(4321)
    } finally {
      await userApi.dispose()
      await context.close()
    }
  })
})
