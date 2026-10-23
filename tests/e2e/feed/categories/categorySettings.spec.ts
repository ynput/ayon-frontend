import { apiAs } from '../../support/session'
import { uniqueName } from '../../support/names'
import { CategorySettingsPage } from '../../pages/CategorySettingsPage'
import { OverviewPage } from '../../pages/OverviewPage'
import {
  CAN_POST,
  CREATOR,
  EVERYONE,
  NONE,
  VIEWER,
  accessLevels,
  expect,
  group,
  team,
  test,
  user,
} from './categoryFixtures'

/** Categories are only ever saved in project settings here: tests must not change studio settings */
test.describe('comment category settings', () => {
  test('add a category and choose who can see and post in it', async ({
    page,
    api,
    projectName,
    powerpack,
    restrictedUser,
    setCategories,
  }, testInfo) => {
    // only licensed users are offered in the access dialog
    const alice = await restrictedUser({}, { licensed: true, fullName: 'Alice Archer' })
    const bob = await restrictedUser({}, { licensed: true, fullName: 'Bob Baker' })
    const crew = uniqueName('team')
    await api.createTeam(projectName, crew, [{ name: bob.name }])
    const [bobGroup] = bob.accessGroups
    await setCategories([])

    const settings = new CategorySettingsPage(page)
    await settings.goto(projectName)
    await settings.addCategory(0, 'Lighting review', '#22aa66')
    const access = await settings.openAccess(0)
    await access.add('Alice Archer')
    await access.setLevel('Alice Archer', 'Creator')
    await access.add(crew)
    await access.add(bobGroup)
    await access.setLevel(bobGroup, 'No Access')
    await access.submit()
    await settings.save()

    await expect
      .poll(
        async () =>
          (
            await api.getAddonSettings('powerpack', powerpack, projectName)
          ).activity_categories,
      )
      .toEqual([
        {
          name: 'Lighting review',
          color: '#22aa66',
          access: {
            [EVERYONE]: NONE,
            [user(alice.name)]: CREATOR,
            [team(crew)]: VIEWER,
            [group(bobGroup)]: NONE,
          },
        },
      ])

    // bob is in the team (Viewer) and the group (No access): the higher level wins
    const asAlice = await apiAs(testInfo, alice.name, alice.password)
    const asBob = await apiAs(testInfo, bob.name, bob.password)
    try {
      await expect
        .poll(() => accessLevels(asAlice, projectName))
        .toEqual({ 'Lighting review': CAN_POST })
      await expect
        .poll(() => accessLevels(asBob, projectName))
        .toEqual({ 'Lighting review': VIEWER })
    } finally {
      await asAlice.dispose()
      await asBob.dispose()
    }
  })

  test('project categories replace the studio categories for that project only', async ({
    page,
    api,
    projectName,
    powerpack,
    setCategories,
  }) => {
    const studio = (await api.getAddonSettings('powerpack', powerpack)).activity_categories
    // a new project uses the studio categories
    expect((await api.listActivityCategories(projectName)).map((c) => c.name)).toEqual(
      studio.map((c: { name: string }) => c.name.trim()),
    )

    await setCategories([{ name: 'Project only', access: { [EVERYONE]: CREATOR } }])

    expect((await api.getAddonSettings('powerpack', powerpack)).activity_categories).toEqual(studio)

    const folder = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
    await api.createTask(projectName, {
      folderId: folder.id,
      name: 'lighting',
      taskType: 'Lighting',
    })
    const overview = new OverviewPage(page)
    await overview.goto(projectName)
    await overview.expand('sh010')
    const panel = await overview.openDetails('lighting')
    await panel.openCommentBox()
    expect(await panel.categoryOptions()).toEqual(['Project only'])
  })
})
