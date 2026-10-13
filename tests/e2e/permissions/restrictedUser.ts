import { expect, test as base } from '../fixtures'
import { uniqueName } from '../support/names'

export type Permissions = Record<string, Record<string, unknown>>

export type RestrictedUser = { name: string; password: string; accessGroups: string[] }

type PermissionFixtures = {
  restrictedUser: (
    permissions?: Permissions | Permissions[],
    options?: { licensed?: boolean; fullName?: string },
  ) => Promise<RestrictedUser>
}

export const test = base.extend<PermissionFixtures>({
  restrictedUser: async ({ api, projectName }, use) => {
    const users: string[] = []
    const groups: string[] = []
    await use(async (permissions = {}, options = {}) => {
      const perGroup = Array.isArray(permissions) ? permissions : [permissions]
      const accessGroups: string[] = []
      for (const groupPermissions of perGroup) {
        const name = uniqueName('ag')
        await api.createAccessGroup(name, groupPermissions)
        groups.push(name)
        accessGroups.push(name)
      }
      const user = await api.createUser({
        ...options,
        accessGroups: { [projectName]: accessGroups },
      })
      users.push(user.name)

      // the server caches access groups per process, so wait until the new groups restrict the user
      const restrictions = [...new Set(perGroup.flatMap((p) => Object.keys(p)))].filter((key) =>
        perGroup.some((p) => p[key] && 'enabled' in p[key]),
      )
      const expected = restrictions.map((key) => [key, perGroup.every((p) => !!p[key]?.enabled)])
      await expect
        .poll(async () => {
          const effective = await api.get(`/api/users/${user.name}/permissions/${projectName}`)
          return restrictions.map((key) => [key, !!effective[key]?.enabled])
        })
        .toEqual(expected)
      return { ...user, accessGroups }
    })
    for (const name of users) await api.deleteUser(name)
    for (const name of groups) await api.deleteAccessGroup(name)
  },
})

export { expect }

export const assigned = () => ({ access_type: 'assigned' })
export const hierarchy = (path: string) => ({ access_type: 'hierarchy', path })

export const onlyFolders = (...accessList: Record<string, string>[]) => ({
  enabled: true,
  access_list: accessList,
})
