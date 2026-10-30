import { uniqueName } from '@ynput/ayon-e2e'
import { apiAs } from '../../support/api'
import {
  CAN_POST,
  Category,
  EVERYONE,
  NONE,
  VIEWER,
  CREATOR,
  accessLevels,
  expect,
  group,
  postStatus,
  team,
  test,
  user,
  visibleCategories,
} from './categoryFixtures'

/**
 * Who sees which comment categories. The server decides: the categories endpoint reports each
 * user's level, GraphQL only returns comments in categories they can view, and posting needs Creator.
 * The highest level from `__everyone__`, the user, their access groups and their teams wins.
 */
test.describe('comment category access', () => {
  test('single grants to everyone, a user, a team and an access group', async ({
    api,
    projectName,
    restrictedUser,
    setCategories,
  }, testInfo) => {
    const alice = await restrictedUser()
    const bob = await restrictedUser()
    const crew = uniqueName('team')
    await api.createTeam(projectName, crew, [{ name: alice.name }])
    const [aliceGroup] = alice.accessGroups

    const categories: Category[] = [
      { name: 'Everyone views', access: { [EVERYONE]: VIEWER } },
      { name: 'Everyone posts', access: { [EVERYONE]: CREATOR } },
      { name: 'User views', access: { [user(alice.name)]: VIEWER } },
      { name: 'User posts', access: { [user(alice.name)]: CREATOR } },
      { name: 'User none', access: { [user(alice.name)]: NONE } },
      { name: 'Team views', access: { [team(crew)]: VIEWER } },
      { name: 'Team posts', access: { [team(crew)]: CREATOR } },
      { name: 'Group views', access: { [group(aliceGroup)]: VIEWER } },
      { name: 'Group posts', access: { [group(aliceGroup)]: CREATOR } },
      { name: 'Group none', access: { [group(aliceGroup)]: NONE } },
      { name: 'Not listed', access: {} },
    ]
    await setCategories(categories)

    const folder = await api.createFolder(projectName)
    const task = await api.createTask(projectName, { folderId: folder.id })
    await api.createComment(projectName, 'task', task.id, 'no category')
    for (const { name } of categories) {
      await api.createComment(projectName, 'task', task.id, `in ${name}`, { category: name })
    }

    const asAlice = await apiAs(testInfo, alice.name, alice.password)
    const asBob = await apiAs(testInfo, bob.name, bob.password)
    try {
      await expect
        .poll(() => accessLevels(asAlice, projectName))
        .toEqual({
          'Everyone views': VIEWER,
          'Everyone posts': CAN_POST,
          'User views': VIEWER,
          'User posts': CAN_POST,
          'Team views': VIEWER,
          'Team posts': CAN_POST,
          'Group views': VIEWER,
          'Group posts': CAN_POST,
        })
      // bob is in none of the grants, so only "everyone" applies to him
      expect(await accessLevels(asBob, projectName)).toEqual({
        'Everyone views': VIEWER,
        'Everyone posts': CAN_POST,
      })

      expect(await visibleCategories(asAlice, projectName, 'task', task.id)).toEqual(
        [
          'Everyone posts',
          'Everyone views',
          'Group posts',
          'Group views',
          'Team posts',
          'Team views',
          'User posts',
          'User views',
          null,
        ].sort((a, b) => String(a).localeCompare(String(b))),
      )
      expect(await visibleCategories(asBob, projectName, 'task', task.id)).toEqual([
        'Everyone posts',
        'Everyone views',
        null,
      ])

      // posting needs Creator; Viewer, No access and not listed are refused
      for (const [category, status] of [
        [null, 201],
        ['Everyone posts', 201],
        ['User posts', 201],
        ['Team posts', 201],
        ['Group posts', 201],
        ['Everyone views', 403],
        ['User views', 403],
        ['Team views', 403],
        ['Group views', 403],
        ['User none', 403],
        ['Not listed', 403],
      ] as const) {
        expect(await postStatus(asAlice, projectName, task.id, category), String(category)).toBe(
          status,
        )
      }
      expect(await postStatus(asBob, projectName, task.id, 'User posts')).toBe(403)
    } finally {
      await asAlice.dispose()
      await asBob.dispose()
    }
  })

  test('the highest level wins when grants overlap', async ({
    api,
    projectName,
    restrictedUser,
    setCategories,
  }, testInfo) => {
    // two access groups, so group grants can disagree with each other
    const alice = await restrictedUser([{}, {}])
    const [groupA, groupB] = alice.accessGroups
    const crew = uniqueName('team')
    await api.createTeam(projectName, crew, [{ name: alice.name }])

    await setCategories([
      {
        name: 'Team views, group posts',
        access: { [team(crew)]: VIEWER, [group(groupA)]: CREATOR },
      },
      { name: 'Groups disagree', access: { [group(groupA)]: VIEWER, [group(groupB)]: CREATOR } },
      {
        name: 'Everyone views, user none',
        access: { [EVERYONE]: VIEWER, [user(alice.name)]: NONE },
      },
      {
        name: 'Team posts, user none',
        access: { [team(crew)]: CREATOR, [user(alice.name)]: NONE },
      },
      { name: 'Everyone none, group views', access: { [EVERYONE]: NONE, [group(groupB)]: VIEWER } },
      { name: 'User views, team none', access: { [user(alice.name)]: VIEWER, [team(crew)]: NONE } },
    ])

    const asAlice = await apiAs(testInfo, alice.name, alice.password)
    try {
      await expect
        .poll(() => accessLevels(asAlice, projectName))
        .toEqual({
          'Team views, group posts': CAN_POST,
          'Groups disagree': CAN_POST,
          'Everyone views, user none': VIEWER,
          'Team posts, user none': CAN_POST,
          'Everyone none, group views': VIEWER,
          'User views, team none': VIEWER,
        })
    } finally {
      await asAlice.dispose()
    }
  })

  test('admins and managers see and post in every category', async ({
    api,
    projectName,
    createUser,
    setCategories,
  }, testInfo) => {
    const manager = await createUser({ isManager: true })
    await setCategories([
      { name: 'Not listed', access: {} },
      { name: 'Nobody', access: { [EVERYONE]: NONE } },
      { name: 'Everyone views', access: { [EVERYONE]: VIEWER } },
    ])
    const folder = await api.createFolder(projectName)
    const task = await api.createTask(projectName, { folderId: folder.id })

    const asManager = await apiAs(testInfo, manager.name, manager.password)
    try {
      const everything = {
        'Not listed': CAN_POST,
        Nobody: CAN_POST,
        'Everyone views': CAN_POST,
      }
      expect(await accessLevels(api, projectName)).toEqual(everything)
      expect(await accessLevels(asManager, projectName)).toEqual(everything)

      expect(await postStatus(api, projectName, task.id, 'Nobody')).toBe(201)
      expect(await postStatus(asManager, projectName, task.id, 'Not listed')).toBe(201)

      const all = ['Everyone views', 'Nobody', 'Not listed']
      await api.createComment(projectName, 'task', task.id, 'viewable', {
        category: 'Everyone views',
      })
      expect(await visibleCategories(api, projectName, 'task', task.id)).toEqual(all)
      expect(await visibleCategories(asManager, projectName, 'task', task.id)).toEqual(all)
    } finally {
      await asManager.dispose()
    }
  })

  test('changing team membership or the access map changes what a user sees', async ({
    api,
    projectName,
    restrictedUser,
    setCategories,
  }, testInfo) => {
    const alice = await restrictedUser()
    const crew = uniqueName('team')
    await api.createTeam(projectName, crew, [{ name: alice.name }])
    const access = { [team(crew)]: VIEWER }
    await setCategories([{ name: 'Crew', access }])

    const folder = await api.createFolder(projectName)
    const task = await api.createTask(projectName, { folderId: folder.id })
    await api.createComment(projectName, 'task', task.id, 'for the crew', { category: 'Crew' })

    const asAlice = await apiAs(testInfo, alice.name, alice.password)
    const seen = () => visibleCategories(asAlice, projectName, 'task', task.id)
    try {
      await expect.poll(seen).toEqual(['Crew'])

      await api.createTeam(projectName, crew, [])
      await expect.poll(seen).toEqual([])

      await api.createTeam(projectName, crew, [{ name: alice.name }])
      await expect.poll(seen).toEqual(['Crew'])

      // taking the team out of the category hides it again, giving it to her directly shows it
      await setCategories([{ name: 'Crew', access: {} }])
      await expect.poll(seen).toEqual([])
      await setCategories([{ name: 'Crew', access: { [user(alice.name)]: VIEWER } }])
      await expect.poll(seen).toEqual(['Crew'])
    } finally {
      await asAlice.dispose()
    }
  })
})
