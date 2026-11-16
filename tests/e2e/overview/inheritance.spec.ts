import { Page } from '@playwright/test'
import { expect, test } from '../fixtures'
import { AyonApi } from '../support/api'
import { OverviewPage } from '../pages/OverviewPage'

// ep010 > sq010 > sh010 > anim, ep010 > sq020 > sh020, and assets
const seedTree = async (
  api: AyonApi,
  projectName: string,
  fps: Partial<Record<'ep010' | 'sq010' | 'sq020' | 'sh010', number>> = {},
) => {
  const attrib = (name: keyof typeof fps) =>
    fps[name] === undefined ? {} : { attrib: { fps: fps[name] } }
  const ep010 = await api.createFolder(projectName, {
    name: 'ep010',
    folderType: 'Episode',
    ...attrib('ep010'),
  })
  const sq010 = await api.createFolder(projectName, {
    name: 'sq010',
    folderType: 'Sequence',
    parentId: ep010.id,
    ...attrib('sq010'),
  })
  const sh010 = await api.createFolder(projectName, {
    name: 'sh010',
    folderType: 'Shot',
    parentId: sq010.id,
    ...attrib('sh010'),
  })
  const anim = await api.createTask(projectName, {
    folderId: sh010.id,
    name: 'anim',
    taskType: 'Animation',
  })
  const sq020 = await api.createFolder(projectName, {
    name: 'sq020',
    folderType: 'Sequence',
    parentId: ep010.id,
    ...attrib('sq020'),
  })
  const sh020 = await api.createFolder(projectName, {
    name: 'sh020',
    folderType: 'Shot',
    parentId: sq020.id,
  })
  const assets = await api.createFolder(projectName, { name: 'assets' })
  await api.setWorkingViewColumns('overview', projectName, ['name', 'attrib_fps'])
  const projectFps = (await api.getProject(projectName)).attrib.fps
  return { ep010, sq010, sh010, anim, sq020, sh020, assets, projectFps }
}

type Tree = Awaited<ReturnType<typeof seedTree>>

const ROWS = ['ep010', 'sq010', 'sh010', 'sq020', 'sh020'] as const

const openExpanded = async (page: Page, projectName: string) => {
  const overview = new OverviewPage(page)
  await overview.goto(projectName)
  await expandTree(overview)
  return overview
}

const expandTree = async (overview: OverviewPage) => {
  for (const label of ROWS) await overview.expand(label)
  await expect(overview.row('anim')).toBeVisible()
}

const serverFps = (api: AyonApi, projectName: string, tree: Tree) => async () => {
  const result: Record<string, number> = {}
  for (const name of [...ROWS, 'assets'] as const) {
    result[name] = (await api.getFolder(projectName, tree[name].id)).attrib.fps
  }
  result.anim = (await api.getTask(projectName, tree.anim.id)).attrib.fps
  return result
}

const expectRows = async (
  overview: OverviewPage,
  expected: Record<string, { fps: number; inherited: boolean }>,
) => {
  for (const [label, { fps, inherited }] of Object.entries(expected)) {
    const cell = overview.cell(label, 'attrib_fps')
    await expect(cell).toHaveText(String(fps))
    await expect(cell.locator('.inherited')).toHaveCount(inherited ? 1 : 0)
  }
}

const own = (fps: number) => ({ fps, inherited: false })
const inherited = (fps: number) => ({ fps, inherited: true })

test.describe('overview attribute inheritance', () => {
  test('an attribute set on a top folder reaches every level below it, not the next top folder', async ({
    page,
    api,
    projectName,
  }) => {
    const tree = await seedTree(api, projectName)
    const overview = await openExpanded(page, projectName)

    await overview.editTextCell('ep010', 'attrib_fps', '48')

    const expected = {
      ep010: own(48),
      sq010: inherited(48),
      sh010: inherited(48),
      anim: inherited(48),
      sq020: inherited(48),
      sh020: inherited(48),
      assets: inherited(tree.projectFps),
    }
    await expectRows(overview, expected)
    await expect.poll(serverFps(api, projectName, tree)).toEqual({
      ep010: 48,
      sq010: 48,
      sh010: 48,
      anim: 48,
      sq020: 48,
      sh020: 48,
      assets: tree.projectFps,
    })
    // after a reload the values come from the server only
    await page.reload()
    await expandTree(overview)
    await expectRows(overview, expected)
  })

  test('an override on a middle folder applies to its branch only', async ({
    page,
    api,
    projectName,
  }) => {
    const tree = await seedTree(api, projectName, { ep010: 30 })
    const overview = await openExpanded(page, projectName)

    await overview.editTextCell('sq010', 'attrib_fps', '60')

    const expected = {
      ep010: own(30),
      sq010: own(60),
      sh010: inherited(60),
      anim: inherited(60),
      sq020: inherited(30),
      sh020: inherited(30),
    }
    await expectRows(overview, expected)
    await expect
      .poll(serverFps(api, projectName, tree))
      .toMatchObject({ sq010: 60, sh010: 60, anim: 60, sq020: 30, sh020: 30 })
    await page.reload()
    await expandTree(overview)
    await expectRows(overview, expected)
  })

  test('clearing an override brings back the inherited value', async ({
    page,
    api,
    projectName,
  }) => {
    const tree = await seedTree(api, projectName, { ep010: 30, sq010: 60 })
    const overview = await openExpanded(page, projectName)
    await expect(overview.cell('anim', 'attrib_fps')).toHaveText('60')

    await overview.clickCell('sq010', 'attrib_fps')
    await overview.clearSelectedCells()

    const expected = { sq010: inherited(30), sh010: inherited(30), anim: inherited(30) }
    await expectRows(overview, expected)
    await expect
      .poll(async () => (await api.getFolder(projectName, tree.sq010.id)).ownAttrib)
      .not.toContain('fps')
    await expect
      .poll(serverFps(api, projectName, tree))
      .toMatchObject({ sq010: 30, sh010: 30, anim: 30 })
    await page.reload()
    await expandTree(overview)
    await expectRows(overview, expected)
  })

  test('a shot keeps its own value when a folder above it changes', async ({
    page,
    api,
    projectName,
  }) => {
    const tree = await seedTree(api, projectName, { sh010: 12 })
    const overview = await openExpanded(page, projectName)

    await overview.editTextCell('ep010', 'attrib_fps', '50')

    const expected = {
      sq010: inherited(50),
      sh010: own(12),
      anim: inherited(12),
      sh020: inherited(50),
    }
    await expectRows(overview, expected)
    await expect
      .poll(serverFps(api, projectName, tree))
      .toMatchObject({ ep010: 50, sq010: 50, sh010: 12, anim: 12, sh020: 50 })
    await page.reload()
    await expandTree(overview)
    await expectRows(overview, expected)
  })

  test('a folder created under an inherited value starts with it', async ({
    page,
    api,
    projectName,
  }) => {
    await seedTree(api, projectName, { ep010: 30 })
    const overview = await openExpanded(page, projectName)

    await overview.rowMenu('sq010', 'Create folder')
    await overview.submitCreateDialog('folder', { label: 'sh030', type: 'Shot' })

    await expectRows(overview, { sh030: inherited(30) })
    await expect
      .poll(async () => {
        const created = (await api.listFolders(projectName)).find((f) => f.name === 'sh030')
        return created && (await api.getFolder(projectName, created.id)).attrib.fps
      })
      .toBe(30)
    await page.reload()
    await expandTree(overview)
    await expectRows(overview, { sh030: inherited(30) })
  })

  test('a moved folder and its task take the value of the new parent', async ({
    page,
    api,
    projectName,
  }) => {
    const tree = await seedTree(api, projectName, { sq010: 24, sq020: 50 })
    const overview = await openExpanded(page, projectName)
    await expect(overview.cell('anim', 'attrib_fps')).toHaveText('24')

    await overview.rowMenu('sh010', 'Move')
    await overview.searchMoveDialog('sq020')
    await overview.moveTo('sq020')

    await expect
      .poll(async () => (await api.getFolder(projectName, tree.sh010.id)).parentId)
      .toBe(tree.sq020.id)
    await expect
      .poll(serverFps(api, projectName, tree))
      .toMatchObject({ sq010: 24, sh010: 50, anim: 50 })
    await page.reload()
    await expandTree(overview)
    await expectRows(overview, { sh010: inherited(50), anim: inherited(50) })
  })

  test('renaming a folder updates the paths below it and keeps their values', async ({
    page,
    api,
    projectName,
  }) => {
    const tree = await seedTree(api, projectName, { sq010: 48 })
    const overview = await openExpanded(page, projectName)

    await overview.rename('sq010', 'sq011')

    await expect
      .poll(async () => (await api.getFolder(projectName, tree.sh010.id)).path)
      .toMatch(/^\/?ep010\/sq011\/sh010$/)
    // the flat task list shows the folder path of each task
    await api.setWorkingViewSettings('overview', projectName, {
      showHierarchy: false,
      columns: ['name', 'attrib_fps'].map((name) => ({ name, visible: true })),
    })
    await page.reload()
    await expect(overview.nameCell('anim')).toContainText('ep010/sq011/sh010/')
    await expectRows(overview, { anim: inherited(48) })
    await expect.poll(serverFps(api, projectName, tree)).toMatchObject({ sh010: 48, anim: 48 })
  })
})

test.describe('overview attribute inheritance, pasting', () => {
  test.beforeEach(async ({ context }) => {
    // copy and paste use navigator.clipboard; headless Chromium keeps its own clipboard per browser
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  })

  test('a value pasted into folders of two branches reaches both branches', async ({
    page,
    api,
    projectName,
  }) => {
    const tree = await seedTree(api, projectName)
    await api.updateFolder(projectName, tree.assets.id, { attrib: { fps: 48 } })
    const overview = await openExpanded(page, projectName)

    await overview.clickCell('assets', 'attrib_fps')
    await page.keyboard.press('ControlOrMeta+c')
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('48\n')
    await overview.clickCell('sq010', 'attrib_fps')
    await overview.clickCell('sq020', 'attrib_fps', { add: true })
    await page.keyboard.press('ControlOrMeta+v')

    const expected = {
      ep010: inherited(tree.projectFps),
      sq010: own(48),
      sh010: inherited(48),
      anim: inherited(48),
      sq020: own(48),
      sh020: inherited(48),
    }
    await expectRows(overview, expected)
    await expect
      .poll(serverFps(api, projectName, tree))
      .toMatchObject({
        ep010: tree.projectFps,
        sq010: 48,
        sh010: 48,
        anim: 48,
        sq020: 48,
        sh020: 48,
      })
    await page.reload()
    await expandTree(overview)
    await expectRows(overview, expected)
  })
})
