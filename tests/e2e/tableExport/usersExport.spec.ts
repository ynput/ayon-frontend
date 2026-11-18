import { expect, test } from '../fixtures'
import { menuItem, signInAs, uniqueName } from '@ynput/ayon-e2e'
import { UsersSettingsPage } from '../pages/UsersSettingsPage'
import { column, ExportDialog, pick } from '../pages/ExportDialog'
import { requireAddon } from '../support/addons'
import { requireTableExport } from './requireTableExport'

test.describe('users table export', () => {
  test.beforeEach(async ({ api }) => {
    await requireTableExport(api)
    await requireAddon(api, 'powerpack', { minVersion: '1.7.1' })
  })

  test('export filtered users to Excel with readable license and project access', async ({
    page,
    api,
    createUser,
    projectName,
    accessGroup,
  }, testInfo) => {
    const user = await createUser({
      fullName: 'Export, Årtist',
      email: 'export.artist@e2e.test',
      licensed: true,
      accessGroups: { [projectName]: [accessGroup] },
    })
    const users = new UsersSettingsPage(page)
    await users.goto()
    await users.filter(user.name)
    await expect(users.row(user.name)).toBeVisible()
    const exporter = new ExportDialog(page)
    await exporter.openFromToolbar()
    await exporter.expectChosen('Whole table', 'Excel (.xlsx)', 'Readable')
    const file = await exporter.export()
    await testInfo.attach(file.fileName, {
      body: file.data,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    expect(file.fileName).toMatch(/^users-table-\d{4}-\d{2}-\d{2}\.xlsx$/)
    expect(
      pick(file, [
        'Username',
        'Full name',
        'Email',
        'Access level',
        'Projects access',
        'Has password',
        'Active',
      ]),
    ).toEqual([
      [
        'Username',
        'Full name',
        'Email',
        'Access level',
        'Projects access',
        'Has password',
        'Active',
      ],
      [
        user.name,
        'Export, Årtist',
        'export.artist@e2e.test',
        'User',
        `${projectName}: ${accessGroup}`,
        'TRUE',
        'TRUE',
      ],
    ])
    const stored = await api.getUser(user.name)
    const pools = await api.get('/api/auth/pools')
    expect(column(file, 'License')).toEqual([
      pools.find((p: any) => p.id === stored.data.userPool)?.label ?? '',
    ])
  })

  test('CSV follows the visible row order for every sortable users column', async ({
    page,
    api,
    createUser,
  }) => {
    test.slow()
    const prefix = uniqueName('exportsort')
    const a = await createUser({ name: `${prefix}_a`, fullName: 'Zulu', email: 'z@e2e.test' })
    await createUser({
      name: `${prefix}_b`,
      fullName: 'Alpha',
      email: 'a@e2e.test',
      isManager: true,
    })
    await api.patch(`/api/users/${a.name}`, { active: false })
    const users = new UsersSettingsPage(page)
    await users.goto()
    await users.filter(prefix)
    await expect(users.table.locator('tbody tr')).toHaveCount(2)
    for (const header of [
      'Username',
      'Full name',
      'Email',
      'License',
      'Access level',
      'Default projects access',
      'Has password',
      'Active',
      'Invitation',
    ]) {
      for (const direction of ['ascending', 'descending']) {
        await test.step(`${header} ${direction}`, async () => {
          await users.sort(header, direction)
          const names = await users.visibleNames()
          const exporter = new ExportDialog(page)
          await exporter.openFromToolbar()
          await exporter.choose('CSV', 'Readable')
          expect(column(await exporter.export(), 'Username')).toEqual(names)
        })
      }
    }
  })

  test('export preserves reordered columns', async ({ page, createUser }) => {
    const user = await createUser()
    const users = new UsersSettingsPage(page)
    await users.goto()
    await users.filter(user.name)
    const before = await users.columnNames()
    await users.reorderColumn('Email', 'Username')
    await expect.poll(() => users.columnNames()).not.toEqual(before)
    const headers = await users.columnNames()
    headers.splice(headers.indexOf('Default projects access') + 1, 0, 'Projects access')
    const exporter = new ExportDialog(page)
    await exporter.openFromToolbar()
    const file = await exporter.export()
    expect(file.rows[0]).toEqual(headers)
  })

  test('an export error stays visible and the user can retry', async ({ page, createUser }) => {
    const user = await createUser()
    const users = new UsersSettingsPage(page)
    await users.goto()
    await users.filter(user.name)
    const exporter = new ExportDialog(page)
    await exporter.openFromToolbar()
    const endpoint = '**/api/addons/powerpack/*/export-users'
    await page.route(endpoint, (route) =>
      route.fulfill({ status: 500, json: { detail: 'Export temporarily unavailable' } }),
    )
    await exporter.root.getByRole('button', { name: /^download Export Excel$/ }).click()
    await expect(exporter.root).toContainText('Export temporarily unavailable')
    await expect(exporter.root).toBeVisible()
    await page.unroute(endpoint)
    expect(column(await exporter.export(), 'Username')).toEqual([user.name])
  })

  test('context export includes selected users hidden by the filter', async ({
    page,
    createUser,
  }) => {
    const first = await createUser()
    const second = await createUser()
    const users = new UsersSettingsPage(page)
    await users.goto()
    await users.select(first.name)
    await users.addToSelection(second.name)
    await users.filter(first.name)
    await expect(users.row(second.name)).toBeHidden()
    const exporter = new ExportDialog(page)
    await exporter.openFromContextMenu(users.row(first.name))
    await expect(exporter.option('Selected rows')).toContainText('2')
    await expect(exporter.toggle('All visible columns, not only the selected ones')).toBeHidden()
    await exporter.choose('CSV', 'Readable')
    expect(column(await exporter.export(), 'Username').sort()).toEqual(
      [first.name, second.name].sort(),
    )
  })

  test('context export of an unselected user exports only that user', async ({
    page,
    createUser,
  }) => {
    const selected = await createUser()
    const target = await createUser()
    const users = new UsersSettingsPage(page)
    await users.goto()
    await users.select(selected.name)
    const exporter = new ExportDialog(page)
    await exporter.openFromContextMenu(users.row(target.name))
    await exporter.choose('CSV', 'Readable')
    expect(column(await exporter.export(), 'Username')).toEqual([target.name])
  })

  test('import settings produce a raw CSV accepted by the user import preview', async ({
    page,
    api,
    createUser,
  }, testInfo) => {
    const user = await createUser({ fullName: 'Export, "Quoted" Årtist' })
    await api.patch(`/api/users/${user.name}`, { data: { isDeveloper: true } })
    const users = new UsersSettingsPage(page)
    await users.goto()
    await users.filter(user.name)
    const exporter = new ExportDialog(page)
    await exporter.openFromToolbar()
    await exporter.useImportSettings()
    const file = await exporter.export()
    expect(file.rows[0]).toEqual([
      'name',
      'attrib.fullName',
      'attrib.email',
      'active',
      'data.isAdmin',
      'data.isDeveloper',
    ])
    expect(column(file, 'data.isDeveloper')).toEqual(['true'])
    expect(column(file, 'attrib.fullName')).toEqual(['Export, "Quoted" Årtist'])
    await testInfo.attach(file.fileName, { body: file.data, contentType: 'text/csv' })
    await users.previewImport(file.fileName, file.data)
  })

  test('managers export users without admin import settings', async ({ browser, createUser }) => {
    const manager = await createUser({ isManager: true })
    const { context, page: managerPage } = await signInAs(browser, manager.name, manager.password)
    try {
      const users = new UsersSettingsPage(managerPage)
      await users.goto()
      await users.filter(manager.name)
      const exporter = new ExportDialog(managerPage)
      await exporter.openFromToolbar()
      await expect(
        exporter.root.getByRole('button', { name: 'Use import settings', exact: true }),
      ).toBeHidden()
      await exporter.choose('CSV', 'Readable')
      expect(column(await exporter.export(), 'Username')).toEqual([manager.name])
    } finally {
      await context.close()
    }
  })

  test('an older Power Pack asks for an update before opening user export', async ({ page }) => {
    await page.route('**/api/frontendModules*', async (route) => {
      const response = await route.fetch()
      const modules = await response.json()
      await route.fulfill({
        response,
        json: modules.map((m: any) =>
          m.addonName === 'powerpack' ? { ...m, addonVersion: '1.7.0' } : m,
        ),
      })
    })
    const users = new UsersSettingsPage(page)
    await users.goto()
    await page.getByTestId('table-import-export').click()
    await menuItem(page, 'Export').click()
    await expect(
      page.getByRole('alert').filter({ hasText: 'Update to Power Pack 1.7.1' }),
    ).toBeVisible()
    await expect(new ExportDialog(page).root).toBeHidden()
  })
})
