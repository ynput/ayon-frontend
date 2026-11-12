import { expect, test } from '../fixtures'
import { dialog, menuItem, toast, uniqueName } from '@ynput/ayon-e2e'
import { hasPowerpack } from '../pages/ListsPage'
import { ProjectsList } from '../pages/ProjectsList'
import { ProjectsManagerPage } from '../pages/ProjectsManagerPage'

test.describe('projects manager', () => {
  test('create a new project from the dialog', async ({ page, api }) => {
    const name = uniqueName('newproj')
    const code = `e2e${Math.random().toString(36).slice(2, 8)}`
    // registered before the UI creates it, so it is removed even if the test fails half way
    test.info().attach('project', { body: name })
    try {
      const manager = new ProjectsManagerPage(page)
      await manager.goto()
      await manager.createProject({ label: name, code })

      const project = await api.getProject(name)
      expect(project.code).toBe(code)
      expect(project.active).toBe(true)
      // created with the default anatomy
      expect(project.folderTypes.length).toBeGreaterThan(0)
      expect(project.taskTypes.length).toBeGreaterThan(0)

      await manager.projects.search(name)
      await expect(manager.projectRow(name)).toBeVisible()
    } finally {
      await api.deleteProject(name)
    }
  })

  test('Enter in the edited project name creates the project with that name', async ({
    page,
    api,
  }) => {
    const first = { label: uniqueName('label'), name: uniqueName('custom') }
    const second = { label: uniqueName('label'), name: uniqueName('custom') }
    // registered before the UI creates them, so they are removed even if the test fails half way
    for (const { name } of [first, second]) test.info().attach('project', { body: name })
    try {
      const manager = new ProjectsManagerPage(page)
      await manager.goto()
      await page.getByRole('button', { name: 'add', exact: true }).first().click()
      const createDialog = dialog(page, 'Create a new project')
      await expect(createDialog).toBeVisible()
      // planning projects have no anatomy editor to wait for
      await createDialog
        .locator('label:text-is("Project state") + *')
        .getByRole('button')
        .first()
        .click()
      await page.locator('.options [data-value="planning"]').click()

      const typeName = async ({ label, name }: { label: string; name: string }) => {
        await createDialog.getByLabel('Project label').fill(label)
        await createDialog
          .getByPlaceholder('Project code')
          .fill(`e2e${Math.random().toString(36).slice(2, 8)}`)
        // the generated name turns into an input when clicked
        await createDialog.getByText(label, { exact: true }).click()
        const nameInput = createDialog.getByLabel('Project name')
        await nameInput.fill(name)
        return nameInput
      }

      // Shift+Enter creates it and keeps the dialog open for the next project
      await (await typeName(first)).press('Shift+Enter')
      await expect(toast(page, `Project ${first.label} created`)).toBeVisible({ timeout: 30_000 })
      await expect(createDialog.getByLabel('Project label')).toHaveValue('')

      await (await typeName(second)).press('Enter')
      await expect(toast(page, `Project ${second.label} created`)).toBeVisible({ timeout: 30_000 })
      await expect(createDialog).toBeHidden()
      // the manager selects the project it just created
      await expect(page).toHaveURL(new RegExp(`project=${second.name}`))

      for (const { label, name } of [first, second]) {
        await expect.poll(() => api.projectExists(name)).toBe(true)
        expect((await api.getProject(name)).label).toBe(label)
      }
    } finally {
      // nothing may query the projects while they are dropped
      await page.goto('about:blank')
      for (const { name } of [first, second]) {
        if (await api.projectExists(name)) await api.deleteProject(name)
      }
    }
  })

  test('archive and then delete a project', async ({ page, api, projectName }) => {
    const manager = new ProjectsManagerPage(page)
    await manager.goto()

    await manager.archiveProject(projectName)
    await expect.poll(async () => (await api.getProject(projectName)).active).toBe(false)

    // archived projects drop out of the list until "Show archived" is on
    await expect(manager.projectRow(projectName)).toBeHidden()
    await manager.showArchived()
    await expect(manager.projectRow(projectName)).toBeVisible()

    await manager.deleteProject(projectName)
    await expect.poll(() => api.projectExists(projectName)).toBe(false)
    await expect(manager.projectRow(projectName)).toBeHidden()
  })

  test('activate an archived project', async ({ page, api, projectName }) => {
    await api.patch(`/api/projects/${projectName}`, { active: false })
    const manager = new ProjectsManagerPage(page)
    await manager.goto()
    await manager.showArchived()

    await manager.activateProject(projectName)

    await expect.poll(async () => (await api.getProject(projectName)).active).toBe(true)
    // toggle "Show archived" off again: active projects are listed without it
    await manager.showArchived()
    await manager.projects.search(projectName)
    await expect(manager.projectRow(projectName)).toBeVisible()
  })

  test('create a folder from the menu of a project that is not selected', async ({
    page,
    api,
    projectName,
  }) => {
    test.skip(!(await hasPowerpack(api)), 'project folders need the powerpack addon')
    // the shared prefix lets one search show both projects
    const other = await api.createProject({ name: `${projectName}_f` })
    const label = uniqueName('folder')
    const projectFolderOf = async (name: string) =>
      (await api.get('/api/projects')).projects.find((p: any) => p.name === name)?.projectFolder
    try {
      // the manager selects the project it opens
      await page.goto(`/manageProjects/anatomy?project=${projectName}`)
      const list = new ProjectsList(page)
      await list.search(projectName)
      await list.expectSelection([projectName], [other])

      // the menu is built when it opens, and only offers folders once the powerpack license check is done
      await expect(async () => {
        await list.row(other, { exact: true }).click({ button: 'right' })
        await expect(menuItem(page, 'Move project')).toBeVisible({ timeout: 1_000 })
      }).toPass()

      await list.expectSelection([projectName], [other])
      await expect(page).toHaveURL(new RegExp(`[?&]project=${projectName}(&|$)`))

      await menuItem(page, 'Create folder').click()
      const folderDialog = dialog(page, /^Create Folder/)
      await folderDialog.getByPlaceholder('Enter folder label').fill(label)
      await folderDialog.getByRole('button', { name: /Create folder$/ }).click()
      await expect(folderDialog).toBeHidden()

      await expect.poll(() => projectFolderOf(other)).toBeTruthy()
      const { folders } = await api.get('/api/projectFolders')
      expect(await projectFolderOf(other)).toBe(folders.find((f: any) => f.label === label)?.id)
      expect(await projectFolderOf(projectName)).toBeFalsy()
      await list.expectSelection([projectName], [other])
    } finally {
      await api.deleteProject(other)
      const { folders } = await api.get('/api/projectFolders')
      for (const folder of folders.filter((f: any) => f.label === label)) {
        await api.delete(`/api/projectFolders/${folder.id}`)
      }
    }
  })

  test('rename the label of a project', async ({ page, api, projectName }) => {
    const label = `E2E Renamed ${Math.random().toString(36).slice(2, 8)}`
    const manager = new ProjectsManagerPage(page)
    await manager.goto()

    await manager.renameProject(projectName, label)

    await expect.poll(async () => (await api.getProject(projectName)).label).toBe(label)
    await expect(manager.projectRow(label)).toBeVisible()
    expect(await api.projectExists(projectName)).toBe(true)
  })

  test('change a project attribute in the project anatomy', async ({ page, api, projectName }) => {
    expect((await api.getProject(projectName)).attrib.fps).not.toBe(48)
    const manager = new ProjectsManagerPage(page)
    await manager.goto('anatomy', projectName)
    await manager.anatomy.expand('Attributes')

    const fps = manager.anatomy.field('root_attributes_fps').getByRole('spinbutton')
    await fps.fill('48')
    await fps.blur()
    await manager.saveAnatomy()

    await expect.poll(async () => (await api.getProject(projectName)).attrib.fps).toBe(48)
    await manager.goto('anatomy', projectName)
    await manager.anatomy.expand('Attributes')
    await expect(fps).toHaveValue('48')
  })

  // FLAG (app bug): Select/Checkbox widgets report their null defaults on mount, which enables "Save changes"
  // fixed in ynput/ayon-frontend#2398, switch back to test() once it is merged
  test.fixme(
    'viewing the project anatomy does not mark it as changed',
    async ({ page, projectName }) => {
      const manager = new ProjectsManagerPage(page)
      await manager.goto('anatomy', projectName)
      const save = page.getByRole('button', { name: 'Save changes' })
      await expect(save).toBeDisabled()

      await manager.anatomy.expand('Attributes')

      await expect(
        manager.anatomy.field('root_attributes_fps').getByRole('spinbutton'),
      ).toBeVisible()
      await expect(save).toBeDisabled()
    },
  )

  test('give a user access to a project with an access group', async ({
    page,
    api,
    projectName,
    createUser,
    accessGroup,
  }) => {
    const user = await createUser()
    const manager = new ProjectsManagerPage(page)
    await manager.goto('projectAccess', projectName)

    await manager.addProjectAccess(user.name, accessGroup)

    await expect(manager.accessUserRow(user.name)).toContainText(accessGroup)
    await expect
      .poll(async () => (await api.getUser(user.name)).data.accessGroups?.[projectName])
      .toEqual([accessGroup])
  })

  test('give access to a user that is not selected from its context menu', async ({
    page,
    api,
    projectName,
    createUser,
    accessGroup,
  }) => {
    const selected = await createUser()
    const target = await createUser()
    const manager = new ProjectsManagerPage(page)
    await manager.goto('projectAccess', projectName)
    await manager.selectAccessUser(selected.name)

    await manager.openAccessUserMenu(target.name)

    await manager.expectAccessUserSelected(selected.name)
    await manager.expectAccessUserSelected(target.name, false)

    await manager.addProjectAccessFromMenu(target.name, accessGroup)

    await expect(manager.accessUserRow(target.name)).toContainText(accessGroup)
    await expect(manager.accessUserRow(selected.name)).not.toContainText(accessGroup)
    await expect
      .poll(async () => (await api.getUser(target.name)).data.accessGroups?.[projectName])
      .toEqual([accessGroup])
    expect((await api.getUser(selected.name)).data.accessGroups?.[projectName]).toBeUndefined()
  })
})
