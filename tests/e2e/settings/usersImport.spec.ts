import { test as base, expect } from '../fixtures'
import { uniqueName } from '@ynput/ayon-e2e'
import { UsersSettingsPage } from '../pages/UsersSettingsPage'
import { csvFile } from '../pages/ImportDialog'

// users are studio-wide: every user a file creates is named by the test and deleted after it,
// also when the import failed half way
const test = base.extend<{ fileUser: (label: string) => string }>({
  fileUser: async ({ api }, provide) => {
    const names: string[] = []
    await provide((label) => {
      const name = uniqueName(label)
      names.push(name)
      return name
    })
    const errors: unknown[] = []
    for (const name of names) await api.deleteUser(name).catch((error) => errors.push(error))
    if (errors.length) throw errors[0]
  },
})

const email = (name: string) => `${name}@e2e.test`

test.describe('users import', () => {
  test('a file with AYON column names creates users with every value', async ({
    page,
    api,
    fileUser,
  }) => {
    const ada = fileUser('ada')
    const grace = fileUser('grace')
    const zofie = fileUser('zofie')
    const file = csvFile('studio-users.csv', [
      [
        'name',
        'attrib.fullName',
        'attrib.email',
        'active',
        'data.isAdmin',
        'data.isDeveloper',
        'Developer mode',
      ],
      [ada, 'Ada Lovelace', email(ada), 'true', 'false', 'true', 'yes'],
      [grace, 'Hopper, Grace', email(grace), 'false', 'false', 'false', 'no'],
      [zofie, 'Žofie Nováková', email(zofie), 'TRUE', 'FALSE', 'FALSE', '0'],
    ])
    const users = new UsersSettingsPage(page)
    await users.goto()

    const wizard = await users.openImport()
    await wizard.importWithDefaults(file, { created: 3, updated: 0, skipped: 0, errors: 0 })

    const stored = async (name: string) => {
      const user = await api.getUser(name)
      return {
        fullName: user.attrib.fullName,
        email: user.attrib.email,
        active: user.active,
        isAdmin: !!user.data.isAdmin,
        isDeveloper: !!user.data.isDeveloper,
        developerMode: !!user.attrib.developerMode,
      }
    }
    const expected = {
      [ada]: ['Ada Lovelace', true, true, true],
      [grace]: ['Hopper, Grace', false, false, false],
      [zofie]: ['Žofie Nováková', true, false, false],
    }
    for (const [name, [fullName, active, isDeveloper, developerMode]] of Object.entries(expected)) {
      expect(await stored(name)).toEqual({
        fullName,
        email: email(name),
        active,
        isAdmin: false,
        isDeveloper,
        developerMode,
      })
      await expect(await users.cell(name, 'Full name')).toHaveText(fullName as string)
      await expect(await users.cell(name, 'Email')).toHaveText(email(name))
      await expect(await users.cell(name, 'Access level')).toHaveText('User')
      await expect((await users.cell(name, 'Active')).getByRole('img')).toHaveAccessibleName(
        active ? 'Yes' : 'No',
      )
    }
  })

  test('columns and values AYON does not know are mapped by hand', async ({
    page,
    api,
    fileUser,
  }) => {
    const mia = fileUser('mia')
    const noah = fileUser('noah')
    const lena = fileUser('lena')
    const file = csvFile('hr-export.csv', [
      ['Login', 'Display name', 'E-mail address', 'Department', 'Role', 'Status'],
      [mia, 'Mia Rossi', email(mia), 'Lighting', 'Pipeline TD', 'Active'],
      [noah, 'N/A', email(noah), 'Compositing', 'Artist', 'Inactive'],
      [lena, 'Lena Fischer', email(lena), 'Lighting', 'Artist', 'On leave'],
    ])
    const users = new UsersSettingsPage(page)
    await users.goto()

    const wizard = await users.openImport()
    await wizard.upload(file, { rows: 3 })
    await wizard.mapColumn('Login', 'User name')
    await wizard.mapColumn('Display name', 'Full name')
    await wizard.mapColumn('E-mail address', 'E-Mail')
    await wizard.skipColumn('Department')
    await wizard.mapColumn('Role', 'Developer')
    await wizard.mapColumn('Status', 'Active')
    await wizard.continueToValues()
    await wizard.mapValue('Developer', 'Pipeline TD', true)
    await wizard.mapValue('Developer', 'Artist', false)
    await wizard.mapValue('Active', 'Active', true)
    await wizard.mapValue('Active', 'Inactive', false)
    // "On leave" stays skipped, as AYON reads it: the new user gets the default
    await wizard.skipValue('Full name', 'N/A')
    await wizard.continueToPreview({ created: 3, updated: 0, skipped: 0, errors: 0 })
    await wizard.importData({ created: 3 })
    await wizard.close()

    const [miaUser, noahUser, lenaUser] = await Promise.all(
      [mia, noah, lena].map((name) => api.getUser(name)),
    )
    expect([miaUser.attrib.fullName, !!miaUser.data.isDeveloper, miaUser.active]).toEqual([
      'Mia Rossi',
      true,
      true,
    ])
    expect([noahUser.attrib.fullName || '', !!noahUser.data.isDeveloper, noahUser.active]).toEqual([
      '',
      false,
      false,
    ])
    expect([lenaUser.attrib.fullName, !!lenaUser.data.isDeveloper, lenaUser.active]).toEqual([
      'Lena Fischer',
      false,
      true,
    ])
    expect(noahUser.attrib.email).toBe(email(noah))

    await expect(await users.cell(mia, 'Full name')).toHaveText('Mia Rossi')
    await expect(await users.cell(noah, 'Email')).toHaveText(email(noah))
    await expect(await users.cell(noah, 'Full name')).toHaveText('')
    await expect((await users.cell(noah, 'Active')).getByRole('img')).toHaveAccessibleName('No')
    await expect((await users.cell(lena, 'Active')).getByRole('img')).toHaveAccessibleName('Yes')
  })

  // FLAG (app bug): the wizard keys value mappings by papaparse's typed value ("true"), the server looks them up by the raw cell ("TRUE"), so they are ignored
  test.fixme(
    'values mapped by hand apply to TRUE and FALSE from a spreadsheet',
    async ({ page, api, fileUser }) => {
      const locked = fileUser('locked')
      const open = fileUser('open')
      const file = csvFile('accounts.csv', [
        ['Login', 'Full name', 'Disabled'],
        [locked, 'Locked Account', 'TRUE'],
        [open, 'Open Account', 'FALSE'],
      ])
      const users = new UsersSettingsPage(page)
      await users.goto()

      const wizard = await users.openImport()
      await wizard.upload(file, { rows: 2 })
      await wizard.mapColumn('Login', 'User name')
      await wizard.mapColumn('Disabled', 'Active')
      await wizard.continueToValues()
      // the review lists spreadsheet booleans as true and false
      await wizard.mapValue('Active', 'true', false)
      await wizard.mapValue('Active', 'false', true)
      await wizard.continueToPreview({ created: 2, errors: 0 })
      await wizard.importData({ created: 2 })
      await wizard.close()

      expect((await api.getUser(locked)).active).toBe(false)
      expect((await api.getUser(open)).active).toBe(true)
      await expect((await users.cell(locked, 'Active')).getByRole('img')).toHaveAccessibleName('No')
      await expect((await users.cell(open, 'Active')).getByRole('img')).toHaveAccessibleName('Yes')
    },
  )

  test('rows that only name existing users are skipped and change nothing', async ({
    page,
    api,
    createUser,
  }) => {
    const first = await createUser({ fullName: 'Kept Name', email: 'kept.first@e2e.test' })
    const second = await createUser({ fullName: 'Also Kept', email: 'kept.second@e2e.test' })
    // blank cells do not clear what the users have
    const file = csvFile('no-changes.csv', [
      ['name', 'attrib.fullName', 'attrib.email'],
      [first.name, '', ''],
      [second.name, '', ''],
    ])
    const users = new UsersSettingsPage(page)
    await users.goto()

    const wizard = await users.openImport()
    await wizard.upload(file, { rows: 2 })
    await wizard.continueToValues()
    await wizard.continueToPreview({ created: 0, updated: 0, skipped: 2, errors: 0 })
    await wizard.expectRowReasons(
      'skipped',
      { 1: 'Nothing to update', 2: 'Nothing to update' },
      false,
    )
    await wizard.importData({ created: 0, updated: 0, skipped: 2, errors: 0 })
    await wizard.close()

    for (const [user, fullName, mail] of [
      [first, 'Kept Name', 'kept.first@e2e.test'],
      [second, 'Also Kept', 'kept.second@e2e.test'],
    ] as const) {
      const stored = await api.getUser(user.name)
      expect([stored.attrib.fullName, stored.attrib.email, stored.active]).toEqual([
        fullName,
        mail,
        true,
      ])
      await expect(await users.cell(user.name, 'Full name')).toHaveText(fullName)
      await expect(await users.cell(user.name, 'Email')).toHaveText(mail)
    }
  })

  test('Update only updates existing users and skips names that match no user', async ({
    page,
    api,
    createUser,
    fileUser,
  }) => {
    const existing = await createUser({ fullName: 'Before Update' })
    const ghost = fileUser('ghost')
    const file = csvFile('update-only.csv', [
      ['name', 'Full name'],
      [existing.name, 'After Update'],
      [ghost, 'Nobody Here'],
    ])
    const users = new UsersSettingsPage(page)
    await users.goto()

    const wizard = await users.openImport()
    await wizard.setImportMode('Update only')
    await wizard.upload(file, { rows: 2 })
    await wizard.continueToValues()
    await wizard.continueToPreview({ created: 0, updated: 1, skipped: 1, errors: 0 })
    await wizard.expectRowReasons('skipped', { 2: `No existing user '${ghost}'` }, false)
    await wizard.importData({ created: 0, updated: 1, skipped: 1, errors: 0 })
    await wizard.close()

    expect((await api.getUser(existing.name)).attrib.fullName).toBe('After Update')
    expect(await api.userExists(ghost)).toBe(false)
    await expect(await users.cell(existing.name, 'Full name')).toHaveText('After Update')
    await expect(users.row(ghost)).toBeHidden()
  })

  test('a file updates the names, emails and attributes of existing users', async ({
    page,
    api,
    createUser,
  }) => {
    const lead = await createUser({
      fullName: 'Old Lead',
      email: 'old.lead@e2e.test',
      isManager: true,
    })
    const artist = await createUser({
      fullName: 'Old Artist',
      email: 'old.artist@e2e.test',
      developerMode: true,
    })
    const file = csvFile('renamed-users.csv', [
      ['name', 'Full name', 'E-Mail', 'Developer mode'],
      [lead.name, 'Rosa Lindqvist', email(lead.name), 'true'],
      [artist.name, 'Tomás Ortega-Ruiz', email(artist.name), 'false'],
    ])
    const users = new UsersSettingsPage(page)
    await users.goto()

    const wizard = await users.openImport()
    await wizard.importWithDefaults(file, { created: 0, updated: 2, skipped: 0, errors: 0 })

    const storedLead = await api.getUser(lead.name)
    expect(storedLead.attrib).toMatchObject({
      fullName: 'Rosa Lindqvist',
      email: email(lead.name),
      developerMode: true,
    })
    // what the file does not set stays as it was
    expect([storedLead.active, !!storedLead.data.isManager, !!storedLead.data.isAdmin]).toEqual([
      true,
      true,
      false,
    ])
    const storedArtist = await api.getUser(artist.name)
    expect(storedArtist.attrib).toMatchObject({
      fullName: 'Tomás Ortega-Ruiz',
      email: email(artist.name),
    })
    expect(!!storedArtist.attrib.developerMode).toBe(false)
    expect([storedArtist.active, !!storedArtist.data.isManager]).toEqual([true, false])

    await expect(await users.cell(lead.name, 'Full name')).toHaveText('Rosa Lindqvist')
    await expect(await users.cell(lead.name, 'Email')).toHaveText(email(lead.name))
    await expect(await users.cell(lead.name, 'Access level')).toHaveText('Manager')
    await expect(await users.cell(artist.name, 'Full name')).toHaveText('Tomás Ortega-Ruiz')
    await expect(await users.cell(artist.name, 'Email')).toHaveText(email(artist.name))
  })

  // FLAG (app bug): ayon-backend UserExportImportModel.update applies only data and attrib, so "active" is dropped while the row counts as updated
  test.fixme('a file deactivates existing users', async ({ page, api, createUser }) => {
    const leaver = await createUser()
    const file = csvFile('leavers.csv', [
      ['name', 'active'],
      [leaver.name, 'false'],
    ])
    const users = new UsersSettingsPage(page)
    await users.goto()

    const wizard = await users.openImport()
    await wizard.importWithDefaults(file, { created: 0, updated: 1, skipped: 0, errors: 0 })

    expect((await api.getUser(leaver.name)).active).toBe(false)
    await expect((await users.cell(leaver.name, 'Active')).getByRole('img')).toHaveAccessibleName(
      'No',
    )
  })
})
