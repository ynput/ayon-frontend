import { Page } from '@playwright/test'
import { signInAs, uniqueName } from '@ynput/ayon-e2e'
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
    await expect(panel.commentEditor).toContainText(`@${label}`)
    await panel.commentEditor.pressSequentially('cross-folder reference')
    await panel.submitComment()
    await expect(panel.reference('cross-folder reference', label)).toBeVisible()
    await expect
      .poll(async () =>
        (await api.listActivities(projectName, 'folder', data.local.id)).map((a) => a.body.trim()),
      )
      .toEqual([`[${label}](${type}:${target.id}) cross-folder reference`])
    await expect
      .poll(async () =>
        (
          await api.listFeedActivities(projectName, target.id, { activityTypes: ['comment'] })
        ).map((a) => ({ body: a.body.trim(), referenceType: a.referenceType })),
      )
      .toContainEqual({
        body: `[${label}](${type}:${target.id}) cross-folder reference`,
        referenceType: 'mention',
      })
    await panel.reference('cross-folder reference', label).click()
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

test('the toolbar and slash menu each offer one Mention command', async ({
  page,
  api,
  projectName,
}) => {
  const data = await seed(api, projectName)
  const panel = await openFolder(page, projectName, data)
  await panel.openCommentBox()
  const mentionButtons = panel.newCommentBox.locator('button[data-tooltip="Mention"]')
  await expect(mentionButtons).toHaveCount(1)
  await expect(panel.newCommentBox.locator('button[data-tooltip*="mention" i]')).toHaveCount(1)
  await mentionButtons.click()
  await expect(panel.commentEditor).toHaveText('@')
  await expect(page.getByText('@ Mention', { exact: true })).toBeVisible()
  await panel.commentEditor.press('ControlOrMeta+a')
  await panel.commentEditor.pressSequentially('/')
  const commands = page.getByRole('option').filter({ hasText: /mention/i })
  await expect(commands).toHaveCount(1)
  await expect(commands).toContainText('Mention')
  await commands.click()
  await expect(panel.commentEditor).toHaveText('@')
  await expect(page.getByText('@ Mention', { exact: true })).toBeVisible()
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
