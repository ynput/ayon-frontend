import { expect, test as base } from '../fixtures'
import { uniqueName } from '../support/names'

/**
 * Access group permissions as the server stores them (`ayon_server/access/permissions.py`), e.g.
 * `{ update: { enabled: true, access_list: [{ access_type: 'hierarchy', path: 'sh010' }] } }`.
 * A permission group that is not `enabled` does not restrict anything.
 */
export type Permissions = Record<string, Record<string, unknown>>

export type RestrictedUser = { name: string; password: string; accessGroups: string[] }

type PermissionFixtures = {
  /**
   * A regular (non-manager) user with access to the test project only, through new access groups
   * with these permissions (one group per entry). Users and groups are deleted after the test.
   * Sign in as the user with `signInAs`, check the server with `apiAs` or the admin `api`.
   */
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

      // The server caches access groups per process and updates the cache from an event, so a new
      // group is briefly unknown, and a user whose groups are unknown is not restricted at all.
      // Wait until the user's effective permissions show the restrictions (a restriction applies
      // only when every group of the user enables it).
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
    // users first, so the server does not have to drop the deleted groups from them
    for (const name of users) await api.deleteUser(name)
    for (const name of groups) await api.deleteAccessGroup(name)
  },
})

export { expect }

/** Entries of the folder access lists of the `create`, `read`, `update` and `delete` permissions */
export const assigned = () => ({ access_type: 'assigned' })
export const hierarchy = (path: string) => ({ access_type: 'hierarchy', path })

/** A `create`/`read`/`update`/`delete` permission that allows only these folders */
export const onlyFolders = (...accessList: Record<string, string>[]) => ({
  enabled: true,
  access_list: accessList,
})
