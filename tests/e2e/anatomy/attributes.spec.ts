import { Page } from '@playwright/test'
import { expect, test } from '../fixtures'
import { AyonApi } from '../support/api'
import { menuItem, toast } from '../support/ui'
import { DetailsPanel } from '../pages/DetailsPanel'
import { OverviewPage } from '../pages/OverviewPage'
import { ProductsPage } from '../pages/ProductsPage'
import { ProjectsManagerPage } from '../pages/ProjectsManagerPage'

// Every test changes the anatomy of its own project only (the `projectName` fixture).

/** Folder sh010 with the task anim */
const seedShot = async (api: AyonApi, projectName: string) => {
  // the value the tests change it to is not the default
  expect((await api.getProject(projectName)).attrib.resolutionWidth).not.toBe(4096)
  const folder = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
  const task = await api.createTask(projectName, { folderId: folder.id, name: 'anim' })
  return { folder, task }
}

/** Change the "Resolution width" project attribute in the project anatomy and save */
const setResolutionWidth = async (
  manager: ProjectsManagerPage,
  projectName: string,
  width: number,
) => {
  await manager.goto('anatomy', projectName)
  await manager.anatomy.expand('Attributes')
  const input = manager.anatomy.field('root_attributes_resolutionWidth').getByRole('spinbutton')
  await input.fill(String(width))
  await input.blur()
  await manager.saveAnatomy()
}

/** The overview with sh010 expanded and only the name and resolution width columns */
const openOverviewWithWidth = async (page: Page, api: AyonApi, projectName: string) => {
  await api.setWorkingViewColumns('overview', projectName, ['name', 'attrib_resolutionWidth'])
  const overview = new OverviewPage(page)
  await overview.goto(projectName)
  await overview.expand('sh010')
  return overview
}

test.describe('project anatomy: attributes and roots', () => {
  test('tasks inherit a project attribute changed in the anatomy', async ({
    page,
    api,
    projectName,
  }) => {
    const { task } = await seedShot(api, projectName)
    const manager = new ProjectsManagerPage(page)

    await setResolutionWidth(manager, projectName, 4096)

    await expect
      .poll(async () => {
        const { attrib, ownAttrib } = await api.getTask(projectName, task.id)
        return { width: attrib.resolutionWidth, own: ownAttrib.includes('resolutionWidth') }
      })
      .toEqual({ width: 4096, own: false })
    // the overview shows the inherited value, greyed out
    const overview = await openOverviewWithWidth(page, api, projectName)
    await expect(overview.cell('anim', 'attrib_resolutionWidth')).toHaveText('4096')
    await expect(
      overview.cell('anim', 'attrib_resolutionWidth').locator('.inherited'),
    ).toBeVisible()
  })

  // FLAG (backend bug): saving project attributes rebuilds the inherited attributes in the database
  // (`ProjectEntity.save` -> `rebuild_inherited_attributes`) but not the cached folder list (Redis
  // "project-folders", 1 h TTL) that `GET /api/projects/{project}/folders?attrib=true` serves, so
  // the overview shows the old value on folder rows until a folder or task of the project changes.
  // `GET /api/projects/{project}/folders/{id}` and the task rows are right.
  // fixed in ynput/ayon-backend#1169, switch back to test() once it is merged
  test.fixme(
    'folders inherit a project attribute changed in the anatomy',
    async ({ page, api, projectName }) => {
      const { folder } = await seedShot(api, projectName)
      const manager = new ProjectsManagerPage(page)

      await setResolutionWidth(manager, projectName, 4096)

      await expect
        .poll(async () => (await api.getFolder(projectName, folder.id)).attrib.resolutionWidth)
        .toBe(4096)
      // the folder list the overview loads its folders from
      const list = await api.get(`/api/projects/${projectName}/folders`, { attrib: true })
      expect(list.folders[0].attrib.resolutionWidth).toBe(4096)
      const overview = await openOverviewWithWidth(page, api, projectName)
      await expect(overview.cell('sh010', 'attrib_resolutionWidth')).toHaveText('4096')
      await expect(
        overview.cell('sh010', 'attrib_resolutionWidth').locator('.inherited'),
      ).toBeVisible()
    },
  )

  test('a folder created in the overview starts with the project attribute values', async ({
    page,
    api,
    projectName,
  }) => {
    const manager = new ProjectsManagerPage(page)
    await manager.goto('anatomy', projectName)
    await manager.anatomy.expand('Attributes')
    const frameStart = manager.anatomy.field('root_attributes_frameStart').getByRole('spinbutton')
    await frameStart.fill('86400')
    await frameStart.blur()
    await manager.saveAnatomy()
    await expect.poll(async () => (await api.getProject(projectName)).attrib.frameStart).toBe(86400)

    await api.setWorkingViewColumns('overview', projectName, ['name', 'attrib_frameStart'])
    const overview = new OverviewPage(page)
    await overview.goto(projectName)
    await overview.createFolder({ label: 'sq010', type: 'Sequence' })

    // inherited, so shown greyed out
    await expect(overview.cell('sq010', 'attrib_frameStart')).toHaveText('86400')
    await expect(overview.cell('sq010', 'attrib_frameStart').locator('.inherited')).toBeVisible()
    await expect
      .poll(async () => (await api.listFolders(projectName)).map((f) => f.name))
      .toEqual(['sq010'])
    const [folder] = await api.listFolders(projectName)
    const { attrib, ownAttrib } = await api.getFolder(projectName, folder.id)
    expect(attrib.frameStart).toBe(86400)
    expect(ownAttrib).not.toContain('frameStart')
  })

  test('a project root changed in the anatomy resolves the paths of published files', async ({
    page,
    context,
    api,
    projectName,
  }) => {
    const [root] = (await api.getProjectAnatomy(projectName)).roots
    const folder = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
    const product = await api.createProduct(projectName, { folderId: folder.id, name: 'plate' })
    const version = await api.createVersion(projectName, { productId: product.id })
    await api.createRepresentation(projectName, {
      versionId: version.id,
      name: 'exr',
      files: [`{root[${root.name}]}/shots/sh010/plate.exr`],
    })
    const manager = new ProjectsManagerPage(page)
    await manager.goto('anatomy', projectName)
    await manager.anatomy.expand('Roots')

    await manager.anatomy.fillText('root_roots_0_linux', '/mnt/e2e/projects')
    await manager.saveAnatomy()

    await expect
      .poll(async () => (await api.getProjectAnatomy(projectName)).roots[0])
      .toEqual({ ...root, linux: '/mnt/e2e/projects' })
    // "Copy Linux path" of a representation in the version's files resolves the root
    // (headless Chromium keeps its own clipboard per browser)
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    const products = new ProductsPage(page)
    await products.goto(projectName)
    await products.openDetails('plate - v001')
    const panel = new DetailsPanel(page)
    // FLAG: the "Version files" tab is an icon-only button named after its icon
    await panel.root.getByRole('button', { name: 'order_play', exact: true }).click()
    await panel.root.getByRole('row', { name: /exr/ }).click({ button: 'right' })
    await menuItem(page, 'Copy path').hover()
    await menuItem(page, 'Copy Linux path').click()

    const path = '/mnt/e2e/projects/shots/sh010/plate.exr'
    await expect(toast(page, `Copied To Clipboard: ${path}`)).toBeVisible()
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(path)
  })
})
