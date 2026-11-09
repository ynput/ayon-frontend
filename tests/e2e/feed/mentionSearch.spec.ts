import { Locator, Page, Route } from '@playwright/test'
import { dialog, signInAs, uniqueName } from '@ynput/ayon-e2e'
import { expect, hierarchy, onlyFolders, test } from '../permissions/restrictedUser'
import { apiAs, AyonApi } from '../support/api'
import { OverviewPage } from '../pages/OverviewPage'
import { DetailsPanel } from '../pages/DetailsPanel'
import { MentionPicker } from '../pages/MentionPicker'
import { ProductsPage } from '../pages/ProductsPage'

const seed = async (api: AyonApi, project: string) => {
  const parent = await api.createFolder(project, { name: uniqueName('sequence') })
  const local = await api.createFolder(project, { name: uniqueName('shotA'), parentId: parent.id })
  const remoteParent = await api.createFolder(project, { name: uniqueName('remoteSequence') })
  const remote = await api.createFolder(project, {
    name: `zx${uniqueName('shotB')}`,
    parentId: remoteParent.id,
  })
  const taskName = uniqueName('compositing')
  const localTask = await api.createTask(project, { folderId: local.id, name: taskName })
  const remoteTask = await api.createTask(project, { folderId: remote.id, name: taskName })
  const product = await api.createProduct(project, {
    folderId: remote.id,
    name: uniqueName('render'),
  })
  const version = await api.createVersion(project, { productId: product.id, taskId: remoteTask.id })
  const localProduct = await api.createProduct(project, {
    folderId: local.id,
    name: uniqueName('localRender'),
  })
  const localVersion = await api.createVersion(project, {
    productId: localProduct.id,
    taskId: localTask.id,
    version: 2,
  })
  return {
    parent,
    local,
    remoteParent,
    remote,
    localTask,
    remoteTask,
    product,
    version,
    localProduct,
    localVersion,
  }
}

const openFolder = async (page: Page, project: string, data: Awaited<ReturnType<typeof seed>>) => {
  const overview = new OverviewPage(page)
  await overview.goto(project)
  await overview.expand(data.parent.name)
  return overview.openDetails(data.local.name)
}

test('a single @ opens one picker with all five filters', async ({ page, api, projectName }) => {
  const data = await seed(api, projectName)
  const panel = await openFolder(page, projectName, data)
  await panel.openCommentBox()
  const picker = new MentionPicker(page, panel.commentEditor)
  await picker.search('')
  await expect(picker.title).toHaveCount(1)
  await expect(picker.list).toHaveCount(1)
  for (const type of ['users', 'teams', 'tasks', 'folders', 'versions']) {
    await expect(page.getByRole('button', { name: `Filter ${type}`, exact: true })).toBeVisible()
  }
})

for (const trigger of ['@@', '@@@']) {
  test(`${trigger} does not open a mention picker`, async ({ page, api, projectName }) => {
    const data = await seed(api, projectName)
    const panel = await openFolder(page, projectName, data)
    await panel.openCommentBox()
    await panel.commentEditor.pressSequentially(trigger)
    await expect(panel.commentEditor).toHaveText(trigger)
    await expect(page.getByText('@ Mention', { exact: true })).toBeHidden()
    await expect(page.getByRole('option')).toHaveCount(0)
  })
}

test('empty @ lists sibling tasks, folders, users and versions taking turns', async ({
  page,
  api,
  projectName,
}) => {
  const data = await seed(api, projectName)
  const sibling = await api.createFolder(projectName, {
    name: uniqueName('shotC'),
    parentId: data.parent.id,
  })
  const overview = new OverviewPage(page)
  await overview.goto(projectName)
  await overview.expand(data.parent.name)
  await overview.expand(data.local.name)
  const panel = await overview.openDetails(data.localTask.name)
  await panel.openCommentBox()
  const picker = new MentionPicker(page, panel.commentEditor)
  await picker.search('')
  await expect(picker.options).toHaveCount(5)
  // which users show depends on the server: a sibling task, the folder of the task, a user,
  // a version, then the folder next to it
  await expect(picker.options.nth(0)).toContainText(data.localTask.name)
  await expect(picker.options.nth(0)).toContainText('Task')
  await expect(picker.options.nth(1)).toContainText(data.local.name)
  await expect(picker.options.nth(1)).toContainText('Folder')
  await expect(picker.options.nth(2)).toContainText(/User|Team/)
  await expect(picker.options.nth(3)).toContainText('v002')
  await expect(picker.options.nth(3)).toContainText('Version')
  await expect(picker.options.nth(4)).toContainText(sibling.name)
  await expect(picker.options.nth(4)).toContainText('Folder')
  await expect(picker.option(data.remote.name)).toHaveCount(0)
  await expect(picker.option('v001')).toHaveCount(0)
})

test('suggested tasks and versions are written with their folder and product', async ({
  page,
  api,
  projectName,
}) => {
  const data = await seed(api, projectName)
  const overview = new OverviewPage(page)
  await overview.goto(projectName)
  await overview.expand(data.parent.name)
  await overview.expand(data.local.name)
  const panel = await overview.openDetails(data.localTask.name)
  await panel.openCommentBox()
  const picker = new MentionPicker(page, panel.commentEditor)

  await picker.search('')
  await picker.filter('tasks')
  await picker.option(data.localTask.name).click()
  await expect(panel.commentEditor).toContainText(`@${data.local.name}/${data.localTask.name}`)

  await panel.commentEditor.pressSequentially('@')
  await picker.filter('versions')
  await picker.option('v002').click()
  await expect(panel.commentEditor).toContainText(
    `@${data.local.name}/${data.localProduct.name}/v002`,
  )
})

test('a sibling folder is listed before project results', async ({ page, api, projectName }) => {
  const data = await seed(api, projectName)
  const prefix = uniqueName('nearShot')
  const sibling = await api.createFolder(projectName, {
    name: `${prefix}_sibling`,
    parentId: data.parent.id,
  })
  for (let i = 0; i < 6; i++) {
    await api.createFolder(projectName, { name: `${prefix}_${i}`, parentId: data.remoteParent.id })
  }
  const panel = await openFolder(page, projectName, data)
  await panel.openCommentBox()
  const picker = new MentionPicker(page, panel.commentEditor)
  await picker.search(prefix)
  await expect(picker.options).toHaveCount(5)
  await expect(picker.options.first()).toContainText(sibling.name)
  await expect(picker.options.first()).toContainText('Folder')
  await expect(picker.option(sibling.name)).toHaveCount(1)
})

test('project search starts at two characters after a debounce', async ({
  page,
  api,
  projectName,
}) => {
  const data = await seed(api, projectName)
  const panel = await openFolder(page, projectName, data)
  await panel.openCommentBox()
  const picker = new MentionPicker(page, panel.commentEditor)
  await page.clock.install()
  await panel.commentEditor.pressSequentially('@z')
  await page.clock.runFor(1000)
  await expect(picker.option(data.remote.name)).toHaveCount(0)
  await panel.commentEditor.pressSequentially('x')
  await page.clock.runFor(100)
  await expect(picker.option(data.remote.name)).toHaveCount(0)
  await page.clock.runFor(500)
  await expect(picker.option(data.remote.name).first()).toBeVisible()
})

test('project search keeps the local match first without duplicating it', async ({
  page,
  api,
  projectName,
}) => {
  const data = await seed(api, projectName)
  const panel = await openFolder(page, projectName, data)
  await panel.openCommentBox()
  const picker = new MentionPicker(page, panel.commentEditor)
  await picker.search(data.localTask.name)
  const remote = picker.option(data.remote.name)
  await expect(remote).toBeVisible()
  await expect(picker.options).toHaveCount(2)
  await expect(picker.options.first()).toContainText(data.local.name)
  await expect(picker.options.last()).toContainText(`${data.remoteParent.name}/${data.remote.name}`)
})

test('search results the picker already lists leave their slots to other matches', async ({
  page,
  api,
  projectName,
}) => {
  const data = await seed(api, projectName)
  const prefix = uniqueName('slotTask')
  for (let i = 0; i < 6; i++) {
    await api.createTask(projectName, { folderId: data.local.id, name: `${prefix}_${i}` })
  }
  const overview = new OverviewPage(page)
  await overview.goto(projectName)
  await overview.expand(data.parent.name)
  await overview.expand(data.local.name)
  const panel = await overview.openDetails(`${prefix}_0`)
  await panel.openCommentBox()
  const picker = new MentionPicker(page, panel.commentEditor)
  // the sibling tasks are listed already and the search finds the same tasks
  await picker.search(prefix)
  await expect(picker.options).toHaveCount(5)
  const labels = await picker.options.allTextContents()
  expect(new Set(labels).size).toBe(5)
  for (const label of labels) expect(label).toContain(prefix)
})

test('a filter without matches keeps the picker open so it can be turned off', async ({
  page,
  api,
  projectName,
}) => {
  const data = await seed(api, projectName)
  const panel = await openFolder(page, projectName, data)
  await panel.openCommentBox()
  const picker = new MentionPicker(page, panel.commentEditor)
  await picker.search('')
  await expect(picker.options.first()).toBeVisible()
  // no folder is suggested without a search
  await picker.filter('folders')
  await expect(picker.title).toBeVisible()
  await expect(page.getByText('Type to search', { exact: true })).toBeVisible()
  await picker.filter('folders')
  await expect(picker.options.first()).toBeVisible()
})

test('slash path search selects only the task in the named folder', async ({
  page,
  api,
  projectName,
}) => {
  const data = await seed(api, projectName)
  const panel = await openFolder(page, projectName, data)
  await panel.openCommentBox()
  const picker = new MentionPicker(page, panel.commentEditor)
  await picker.search(`${data.remote.name}/${data.remoteTask.name.slice(0, -3)}`)
  await expect(picker.option(data.remoteTask.name)).toBeVisible()
  await expect(picker.options).toHaveCount(1)
  await expect(picker.options.first()).toContainText(
    `${data.remoteParent.name}/${data.remote.name}`,
  )
})

test('words separated by spaces find one version of a product in a folder', async ({
  page,
  api,
  projectName,
}) => {
  const data = await seed(api, projectName)
  // v002 of the product, and v002 of another product in the same folder
  await api.createVersion(projectName, { productId: data.product.id, version: 2 })
  const other = await api.createProduct(projectName, {
    folderId: data.remote.id,
    name: uniqueName('plate'),
  })
  await api.createVersion(projectName, { productId: other.id, version: 2 })
  const panel = await openFolder(page, projectName, data)
  await panel.openCommentBox()
  const picker = new MentionPicker(page, panel.commentEditor)

  await picker.search(`${data.remote.name} ${data.product.name} v2`)
  const option = picker.option(data.product.name)
  await expect(option).toHaveCount(1)
  await expect(option).toContainText('v002')
  await expect(picker.option(other.name)).toHaveCount(0)
  await option.click()
  await expect(panel.commentEditor).toContainText(`@${data.remote.name}/${data.product.name}/v002`)
})

test('a space ends the mention once nothing matches', async ({ page, api, projectName }) => {
  const data = await seed(api, projectName)
  const panel = await openFolder(page, projectName, data)
  await panel.openCommentBox()
  const picker = new MentionPicker(page, panel.commentEditor)
  await picker.search(data.remote.name)
  await expect(picker.option(data.remote.name).first()).toBeVisible()
  await panel.commentEditor.pressSequentially(' thanks for')
  await expect(picker.title).toBeHidden()
  await panel.commentEditor.press('Enter')
  await expect(panel.commentEditor).toContainText(`@${data.remote.name} thanks for`)
})

test('a space ends a filtered mention without leaving a hidden browse option', async ({
  page,
  api,
  projectName,
}) => {
  const data = await seed(api, projectName)
  const panel = await openFolder(page, projectName, data)
  await panel.openCommentBox()
  const picker = new MentionPicker(page, panel.commentEditor)
  await panel.newCommentBox.locator('button[data-tooltip="Mention task"]').click()
  await panel.commentEditor.pressSequentially('zzqq')
  await expect(picker.browse('tasks')).toBeVisible()
  await panel.commentEditor.pressSequentially(' thanks')
  await expect(picker.title).toBeHidden()
  await panel.commentEditor.press('Enter')
  await expect(dialog(page, /^Select Task/)).toBeHidden()
  await expect(panel.commentEditor).toContainText('@zzqq thanks')
})

// the mention lookup of picked entities (by id), held back or emptied
const routeMentionLookup = (page: Page, handle: (route: Route) => Promise<void>) =>
  page.route('**/graphql', async (route) => {
    const body = route.request().postDataJSON()
    if (body?.query?.includes('SearchMentionEntities') && body.variables?.ids) return handle(route)
    return route.continue()
  })

// filters tasks, opens the task picker and picks the remote task
const pickRemoteTask = async (picker: MentionPicker, data: Awaited<ReturnType<typeof seed>>) => {
  const { page } = picker
  await picker.filter('tasks')
  await picker.browse('tasks').click()
  const dialogBox = dialog(page, /^Select Task/)
  await expect(dialogBox).toBeVisible()
  await dialogBox.getByRole('button', { name: 'search', exact: true }).first().click()
  await dialogBox.getByPlaceholder('Search', { exact: true }).first().fill(data.remote.name)
  await dialogBox.getByText(data.remote.name, { exact: true }).click()
  await dialogBox.getByText(data.remoteTask.name, { exact: true }).click()
  await dialogBox.getByRole('button', { name: 'Select tasks', exact: true }).click()
  return dialogBox
}

test('closing the task picker before its lookup returns mentions nothing', async ({
  page,
  api,
  projectName,
}) => {
  const data = await seed(api, projectName)
  let lookups = 0
  await routeMentionLookup(page, async (route) => {
    lookups++
    await new Promise((resolve) => setTimeout(resolve, 1500))
    await route.continue().catch(() => {})
  })
  const panel = await openFolder(page, projectName, data)
  await panel.openCommentBox()
  const picker = new MentionPicker(page, panel.commentEditor)
  await picker.search('comp')
  const dialogBox = await pickRemoteTask(picker, data)
  await expect.poll(() => lookups).toBe(1)
  await page.keyboard.press('Escape')
  await expect(dialogBox).toBeHidden()
  await page.waitForTimeout(2000)
  await expect(panel.commentEditor).toHaveText('@comp')
  await expect(panel.commentEditor.locator('.mention')).toHaveCount(0)
})

test('a picked task that is not found leaves the typed mention editable', async ({
  page,
  api,
  projectName,
}) => {
  const data = await seed(api, projectName)
  await routeMentionLookup(page, async (route) => {
    const response = await route.fetch()
    const json = await response.json()
    json.data.project.tasks.edges = []
    await route.fulfill({ response, json })
  })
  const panel = await openFolder(page, projectName, data)
  await panel.openCommentBox()
  const picker = new MentionPicker(page, panel.commentEditor)
  await picker.search('comp')
  const dialogBox = await pickRemoteTask(picker, data)
  await expect(dialogBox).toBeHidden()
  await expect(panel.commentEditor).toHaveText('@comp')
  // plain text again: backspace removes one character, not the whole query
  await panel.commentEditor.press('Backspace')
  await expect(panel.commentEditor).toHaveText('@com')
})

test('browse picks folders in the entity picker and mentions them', async ({
  page,
  api,
  projectName,
}) => {
  const data = await seed(api, projectName)
  const panel = await openFolder(page, projectName, data)
  await panel.openCommentBox()
  await panel.commentEditor.pressSequentially('see ')
  await panel.newCommentBox.locator('button[data-tooltip="Mention folder"]').click()
  const browse = page.getByRole('option').filter({ hasText: 'Browse folders…' })
  await expect(browse).toBeVisible()
  await browse.click()

  const picker = dialog(page, /^Select Folder/)
  await expect(picker).toBeVisible()
  await picker.getByRole('button', { name: 'search', exact: true }).first().click()
  await picker.getByPlaceholder('Search', { exact: true }).first().fill(data.remote.name)
  await picker.getByText(data.remote.name, { exact: true }).click()
  await picker.getByRole('button', { name: 'Select folders', exact: true }).click()
  await expect(picker).toBeHidden()
  await expect(panel.commentEditor).toHaveText(`see @${data.remote.name} `)
})

test('browse picks a task with its folder, closing it returns to the picker', async ({
  page,
  api,
  projectName,
}) => {
  const data = await seed(api, projectName)
  const panel = await openFolder(page, projectName, data)
  await panel.openCommentBox()
  const picker = new MentionPicker(page, panel.commentEditor)
  await picker.search('comp')
  await picker.filter('tasks')
  await page.getByRole('option').filter({ hasText: 'Browse tasks…' }).click()

  const dialogBox = dialog(page, /^Select Task/)
  await expect(dialogBox).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialogBox).toBeHidden()
  // back where it was, still filtered
  await expect(panel.commentEditor).toHaveText('@comp')
  await expect(page.getByRole('button', { name: 'Filter tasks', exact: true })).toHaveClass(
    /active/,
  )

  await page.getByRole('option').filter({ hasText: 'Browse tasks…' }).click()
  await expect(dialogBox).toBeVisible()
  await dialogBox.getByRole('button', { name: 'search', exact: true }).first().click()
  await dialogBox.getByPlaceholder('Search', { exact: true }).first().fill(data.remote.name)
  await dialogBox.getByText(data.remote.name, { exact: true }).click()
  await dialogBox.getByText(data.remoteTask.name, { exact: true }).click()
  await dialogBox.getByRole('button', { name: 'Select tasks', exact: true }).click()
  await expect(dialogBox).toBeHidden()
  await expect(panel.commentEditor).toHaveText(`@${data.remote.name}/${data.remoteTask.name} `)
  await panel.submitComment()
  await expect
    .poll(async () =>
      (await api.listActivities(projectName, 'folder', data.local.id)).map((a) => a.body.trim()),
    )
    .toEqual([`[${data.remote.name}/${data.remoteTask.name}](task:${data.remoteTask.id})`])
})

// pastes a link copied from the address bar of this server
const pasteLink = async (page: Page, editor: Locator, path: string) => {
  const url = new URL(path, page.url()).href
  await page.evaluate((text) => navigator.clipboard.writeText(text), url)
  await editor.press('ControlOrMeta+v')
  return url
}

test.describe('pasted entity links', () => {
  test.beforeEach(async ({ context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  })

  for (const type of ['folder', 'task', 'version'] as const) {
    test(`a pasted ${type} link becomes its mention`, async ({ page, api, projectName }) => {
      const data = await seed(api, projectName)
      const target = { folder: data.remote, task: data.remoteTask, version: data.version }[type]
      const mention = {
        folder: data.remote.name,
        task: `${data.remote.name}/${data.remoteTask.name}`,
        version: `${data.remote.name}/${data.product.name}/v001`,
      }[type]
      const route = type === 'version' ? 'products' : 'overview'
      const panel = await openFolder(page, projectName, data)
      await panel.openCommentBox()
      await panel.commentEditor.pressSequentially('see ')
      await pasteLink(
        page,
        panel.commentEditor,
        `/projects/${projectName}/${route}?project=${projectName}&type=${type}&id=${target.id}`,
      )
      await expect(panel.commentEditor).toHaveText(`see @${mention} `)
      // the caret is after the mention
      await panel.commentEditor.pressSequentially('please')
      await expect(panel.commentEditor).toHaveText(`see @${mention} please`)
      await panel.submitComment()
      await expect
        .poll(async () =>
          (
            await api.listActivities(projectName, 'folder', data.local.id)
          ).map((a) => a.body.trim()),
        )
        .toEqual([`see [${mention}](${type}:${target.id}) please`])
    })
  }

  test('a pasted link being selected when its entity is found stays a link', async ({
    page,
    api,
    projectName,
  }) => {
    const data = await seed(api, projectName)
    await routeMentionLookup(page, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      await route.continue().catch(() => {})
    })
    const panel = await openFolder(page, projectName, data)
    await panel.openCommentBox()
    const url = await pasteLink(
      page,
      panel.commentEditor,
      `/projects/${projectName}/overview?project=${projectName}&type=task&id=${data.remoteTask.id}`,
    )
    for (let i = 0; i < 3; i++) await panel.commentEditor.press('Shift+ArrowLeft')
    await page.waitForTimeout(2500)
    await expect(panel.commentEditor.getByRole('link', { name: url })).toBeVisible()
    await expect(panel.commentEditor.locator('.mention')).toHaveCount(0)
  })

  test('typing before a pasted link is found keeps the typing on undo', async ({
    page,
    api,
    projectName,
  }) => {
    const data = await seed(api, projectName)
    await routeMentionLookup(page, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      await route.continue().catch(() => {})
    })
    const panel = await openFolder(page, projectName, data)
    await panel.openCommentBox()
    const url = await pasteLink(
      page,
      panel.commentEditor,
      `/projects/${projectName}/overview?project=${projectName}&type=task&id=${data.remoteTask.id}`,
    )
    await panel.commentEditor.pressSequentially(' ok')
    const mention = `@${data.remote.name}/${data.remoteTask.name}`
    await expect(panel.commentEditor).toHaveText(`${mention} ok`)
    // the mention is its own undo step, the typing stays
    await panel.commentEditor.press('ControlOrMeta+z')
    await expect(panel.commentEditor.getByRole('link', { name: url })).toBeVisible()
    await expect(panel.commentEditor).toContainText(' ok')
    await panel.commentEditor.press('ControlOrMeta+Shift+z')
    await expect(panel.commentEditor).toHaveText(`${mention} ok`)
  })

  test('a pasted link to another project stays a link', async ({ page, api, projectName }) => {
    const data = await seed(api, projectName)
    const panel = await openFolder(page, projectName, data)
    await panel.openCommentBox()
    const other = await pasteLink(
      page,
      panel.commentEditor,
      `/projects/otherProject/overview?project=otherProject&type=task&id=${data.remoteTask.id}`,
    )
    await expect(panel.commentEditor.getByRole('link', { name: other })).toBeVisible()
    // still a link once the lookup would be done
    await page.waitForTimeout(500)
    await expect(panel.commentEditor.getByRole('link', { name: other })).toBeVisible()
    await expect(panel.commentEditor.locator('.mention')).toHaveCount(0)
  })
})

test('project search returns at most five unique results', async ({ page, api, projectName }) => {
  const data = await seed(api, projectName)
  const prefix = uniqueName('searchLimit')
  for (let i = 0; i < 7; i++) {
    await api.createFolder(projectName, { name: `${prefix}_${i}`, parentId: data.remoteParent.id })
  }
  const panel = await openFolder(page, projectName, data)
  await panel.openCommentBox()
  const picker = new MentionPicker(page, panel.commentEditor)
  await picker.search(prefix)
  await expect(picker.options).toHaveCount(5)
  const labels = await picker.options.allTextContents()
  expect(new Set(labels).size).toBe(5)
  for (const label of labels) expect(label).toContain(prefix)
})

for (const type of ['folder', 'task', 'version'] as const) {
  test(`post a remote ${type} mention from a folder and open its activity feed`, async ({
    page,
    api,
    projectName,
  }) => {
    const data = await seed(api, projectName)
    const target = { folder: data.remote, task: data.remoteTask, version: data.version }[type]
    const query = {
      folder: data.remote.name,
      task: data.remoteTask.name,
      version: data.product.name,
    }[type]
    const label =
      type === 'version' ? 'v001' : type === 'folder' ? data.remote.name : data.remoteTask.name
    // tasks and versions are written with their folder and product
    const mention = {
      folder: data.remote.name,
      task: `${data.remote.name}/${data.remoteTask.name}`,
      version: `${data.remote.name}/${data.product.name}/v001`,
    }[type]
    const panel = await openFolder(page, projectName, data)
    await panel.openCommentBox()
    const picker = new MentionPicker(page, panel.commentEditor)
    await picker.search(query)
    if (type === 'folder') await picker.filter('folders')
    const option = type === 'task' ? picker.option(data.remote.name) : picker.option(label)
    await expect(option).toHaveCount(1)
    await expect(option).toContainText(
      type === 'folder' ? data.remoteParent.name : data.remote.name,
    )
    if (type === 'version') await expect(option).toContainText(data.product.name)
    await option.click()
    await expect(panel.commentEditor).toContainText(`@${mention}`)
    await panel.commentEditor.pressSequentially('cross-folder reference')
    await panel.submitComment()
    await expect(panel.reference('cross-folder reference', mention)).toBeVisible()
    await expect
      .poll(async () =>
        (await api.listActivities(projectName, 'folder', data.local.id)).map((a) => a.body.trim()),
      )
      .toEqual([`[${mention}](${type}:${target.id}) cross-folder reference`])
    await expect
      .poll(async () =>
        (
          await api.listFeedActivities(projectName, target.id, { activityTypes: ['comment'] })
        ).map((a) => ({ body: a.body.trim(), referenceType: a.referenceType })),
      )
      .toContainEqual({
        body: `[${mention}](${type}:${target.id}) cross-folder reference`,
        referenceType: 'mention',
      })
    await panel.reference('cross-folder reference', mention).click()
    const slideOut = DetailsPanel.slideOut(page)
    await slideOut.expectOpenFor(label)
    if (type === 'task') await expect(slideOut.header).toContainText(data.remote.name)
    if (type === 'version') await expect(slideOut.header).toContainText(data.product.name)
    await expect(slideOut.comment('cross-folder reference')).toBeVisible()
  })
}

for (const type of ['user', 'team'] as const) {
  test(`insert a ${type} with the same @ prefix and save its markdown`, async ({
    page,
    api,
    projectName,
    createUser,
    accessGroup,
  }) => {
    const data = await seed(api, projectName)
    const user = await createUser({ accessGroups: { [projectName]: [accessGroup] } })
    const team = uniqueName('team')
    await api.createTeam(projectName, team, [{ name: user.name }])
    const label = type === 'user' ? user.name : team
    const panel = await openFolder(page, projectName, data)
    await panel.openCommentBox()
    const picker = new MentionPicker(page, panel.commentEditor)
    await picker.search(label)
    await picker.option(label).click()
    await expect(panel.commentEditor).toContainText(`@${label}`)
    await panel.submitComment()
    await expect(panel.comment(label)).toBeVisible()
    await expect
      .poll(async () =>
        (await api.listActivities(projectName, 'folder', data.local.id)).map((a) => a.body.trim()),
      )
      .toEqual([`[${label}](${type}:${label})`])
  })
}

test('filter chips narrow both related items and project results', async ({
  page,
  api,
  projectName,
  createUser,
  accessGroup,
}) => {
  const data = await seed(api, projectName)
  const user = await createUser({ accessGroups: { [projectName]: [accessGroup] } })
  const team = uniqueName('team')
  await api.createTeam(projectName, team, [{ name: user.name }])
  const panel = await openFolder(page, projectName, data)
  await panel.openCommentBox()
  const picker = new MentionPicker(page, panel.commentEditor)
  await picker.search('')
  await picker.filter('tasks')
  await expect(picker.options).toHaveCount(1)
  await expect(picker.options.first()).toContainText(data.localTask.name)
  await picker.search(data.remoteTask.name)
  await expect(picker.option(data.remote.name)).toBeVisible()
  await expect(picker.options).toHaveCount(2)
  await picker.filter('tasks')
  await picker.filter('folders')
  await picker.search(data.remote.name)
  await expect(picker.options).toHaveCount(1)
  await expect(picker.options.first()).toContainText(data.remoteParent.name)
  await picker.filter('folders')
  await picker.filter('versions')
  await picker.search(data.product.name)
  await expect(picker.options).toHaveCount(1)
  await expect(picker.options.first()).toContainText('v001')
  await picker.filter('versions')
  await picker.filter('users')
  await picker.search(user.name)
  await expect(picker.options).toHaveCount(1)
  await expect(picker.options.first()).toContainText(user.name)
  await expect(picker.options.first()).toContainText('User')
  await picker.filter('users')
  await picker.filter('teams')
  await picker.search(team)
  await expect(picker.options).toHaveCount(1)
  await expect(picker.options.first()).toContainText(team)
})

test('the toolbar mentions one type each, the slash menu offers one Mention command', async ({
  page,
  api,
  projectName,
}) => {
  const data = await seed(api, projectName)
  const panel = await openFolder(page, projectName, data)
  await panel.openCommentBox()
  const filterButton = (type: string) =>
    page.getByRole('button', { name: `Filter ${type}`, exact: true })
  const toolbar = [
    { tooltip: 'Mention user', filter: 'users', label: 'User' },
    { tooltip: 'Mention folder', filter: 'folders', label: 'Folder' },
    { tooltip: 'Mention task', filter: 'tasks', label: 'Task' },
    { tooltip: 'Mention version', filter: 'versions', label: 'Version' },
  ]
  await expect(panel.newCommentBox.locator('button[data-tooltip^="Mention"]')).toHaveCount(4)
  await expect(panel.newCommentBox.locator('button[data-tooltip="Mention user"]')).toHaveAttribute(
    'data-shortcut',
    '@',
  )
  for (const { tooltip, filter, label } of toolbar) {
    await panel.commentEditor.press('ControlOrMeta+a')
    await panel.commentEditor.press('Backspace')
    await panel.newCommentBox.locator(`button[data-tooltip="${tooltip}"]`).click()
    await expect(panel.commentEditor).toHaveText('@')
    await expect(page.getByText('@ Mention', { exact: true })).toBeVisible()
    await expect(filterButton(filter)).toHaveClass(/active/)
    // only suggestions of that type, a type without suggestions waits for a search
    const options = page.getByRole('listbox', { name: '', exact: true }).getByRole('option')
    await expect(options.first().or(page.getByText('Type to search')).first()).toBeVisible()
    for (const option of await options.filter({ hasNotText: 'Browse' }).all())
      await expect(option).toContainText(label)
  }

  await panel.commentEditor.press('ControlOrMeta+a')
  await panel.commentEditor.pressSequentially('/')
  const commands = page.getByRole('option').filter({ hasText: /mention/i })
  await expect(commands).toHaveCount(1)
  await expect(commands).toContainText('Mention')
  await commands.click()
  await expect(panel.commentEditor).toHaveText('@')
  await expect(page.getByText('@ Mention', { exact: true })).toBeVisible()
  // a typed or slash command `@` lists every type
  await expect(filterButton('users')).not.toHaveClass(/active/)
})

test('the description editor searches the project and saves a remote folder mention', async ({
  page,
  api,
  projectName,
}) => {
  const data = await seed(api, projectName)
  const panel = await openFolder(page, projectName, data)
  await panel.openTab('details')
  await panel.description.click()
  const editor = panel.description.locator('[contenteditable="true"]')
  await expect(editor).toBeFocused()
  const picker = new MentionPicker(page, editor)
  await picker.search(data.remote.name)
  await picker.filter('folders')
  await picker.option(data.remote.name).click()
  await expect(editor).toContainText(`@${data.remote.name}`)
  await panel.root.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(panel.description).toContainText(data.remote.name)
  await expect
    .poll(async () => (await api.getFolder(projectName, data.local.id)).attrib.description)
    .toBe(`[${data.remote.name}](folder:${data.remote.id})`)
})

test('a restricted user cannot search entities outside their folder access', async ({
  api,
  projectName,
  restrictedUser,
  browser,
}, testInfo) => {
  const data = await seed(api, projectName)
  const allowedFolder = await api.createFolder(projectName, {
    name: uniqueName('allowedShot'),
    parentId: data.parent.id,
  })
  await api.createTask(projectName, { folderId: allowedFolder.id, name: data.remoteTask.name })
  const allowedProduct = await api.createProduct(projectName, {
    folderId: allowedFolder.id,
    name: data.product.name,
  })
  await api.createVersion(projectName, { productId: allowedProduct.id, version: 3 })
  const user = await restrictedUser({ read: onlyFolders(hierarchy(data.parent.name)) })
  const { page, context } = await signInAs(browser, user.name, user.password)
  const userApi = await apiAs(testInfo, user.name, user.password)
  try {
    await expect(userApi.getFolder(projectName, data.remote.id)).rejects.toThrow(/failed with 403/)
    const panel = await openFolder(page, projectName, data)
    await panel.openCommentBox()
    const picker = new MentionPicker(page, panel.commentEditor)
    await picker.search(data.remoteTask.name)
    await expect(picker.option(allowedFolder.name)).toBeVisible()
    await expect(picker.options).toHaveCount(2)
    await expect(picker.option(data.local.name)).toBeVisible()
    await expect(picker.option(data.remote.name)).toHaveCount(0)
    await picker.filter('folders')
    await picker.search('shot')
    await expect(picker.option(allowedFolder.name)).toBeVisible()
    await expect(picker.option(data.local.name)).toBeVisible()
    await expect(picker.options).toHaveCount(2)
    await expect(picker.option(data.remote.name)).toHaveCount(0)
    await picker.filter('folders')
    await picker.filter('versions')
    await picker.search(data.product.name)
    await expect(picker.option('v003')).toBeVisible()
    await expect(picker.options).toHaveCount(1)
    await expect(picker.option('v001')).toHaveCount(0)
  } finally {
    await userApi.dispose()
    await context.close()
  }
})

test('project search excludes products, representations and workfiles', async ({
  page,
  api,
  projectName,
}) => {
  const data = await seed(api, projectName)
  const query = uniqueName('supportedTypes')
  const folder = await api.createFolder(projectName, {
    name: `${query}_folder`,
    parentId: data.remoteParent.id,
  })
  await api.createProduct(projectName, { folderId: data.remote.id, name: `${query}_product` })
  await api.createRepresentation(projectName, {
    versionId: data.version.id,
    name: `${query}_representation`,
    files: [],
  })
  await api.createWorkfile(projectName, {
    taskId: data.remoteTask.id,
    path: `/tmp/${query}_workfile.ma`,
  })
  const panel = await openFolder(page, projectName, data)
  await panel.openCommentBox()
  const picker = new MentionPicker(page, panel.commentEditor)
  await picker.search(query)
  await expect(picker.option(folder.name)).toBeVisible()
  await expect(picker.options).toHaveCount(1)
})

for (const origin of ['task', 'version'] as const) {
  test(`a ${origin} comment can mention a folder elsewhere in the project`, async ({
    page,
    api,
    projectName,
  }) => {
    const data = await seed(api, projectName)
    if (origin === 'task') {
      const overview = new OverviewPage(page)
      await overview.goto(projectName)
      await overview.expand(data.parent.name)
      await overview.expand(data.local.name)
      await overview.openDetails(data.localTask.name)
    } else {
      const products = new ProductsPage(page)
      await products.goto(projectName)
      await products.openDetails(data.localProduct.name)
    }
    const panel = new DetailsPanel(page)
    await panel.expectOpenFor(origin === 'task' ? data.localTask.name : 'v002')
    await panel.openCommentBox()
    const picker = new MentionPicker(page, panel.commentEditor)
    await picker.search(data.remote.name)
    await picker.filter('folders')
    await picker.option(data.remote.name).click()
    await expect(panel.commentEditor).toContainText(`@${data.remote.name}`)
    await panel.submitComment()
    await expect(panel.reference(data.remote.name, data.remote.name)).toBeVisible()
    const originId = origin === 'task' ? data.localTask.id : data.localVersion.id
    await expect
      .poll(async () =>
        (await api.listActivities(projectName, origin, originId)).map((a) => a.body.trim()),
      )
      .toEqual([`[${data.remote.name}](folder:${data.remote.id})`])
  })
}
