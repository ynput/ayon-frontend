import { FullConfig } from '@playwright/test'
import { ApiClass, AyonApi, login } from './api'
import { adminCredentials } from './env'
import { runPrefix } from './names'

export interface TeardownOptions<T extends AyonApi> {
  /** the suite's client class, passed to the hooks */
  Client?: ApiClass<T>
  /** before a leftover user is deleted, e.g. to remove what an addon keeps after a user is gone */
  beforeDeleteUser?: (api: T, name: string) => Promise<void>
  /** removes the suite's own kinds of leftovers whose name starts with `prefix` */
  sweep?: (api: T, prefix: string) => Promise<void>
}

/**
 * The global teardown, a safety net: every fixture cleans up after itself, but a crashed worker or
 * an interrupted run can leave data behind. Removes the users, projects and access groups this run
 * created that are still around, then whatever `sweep` removes.
 *
 *   // tests/e2e/global.teardown.ts
 *   export default ayonTeardown()
 */
export const ayonTeardown =
  <T extends AyonApi = AyonApi>(options: TeardownOptions<T> = {}) =>
  async (config: FullConfig) => {
    const Client = options.Client ?? (AyonApi as unknown as ApiClass<T>)
    const baseURL = (config.projects.find((p) => p.name === 'chromium') ?? config.projects[0])?.use
      .baseURL
    if (!baseURL) return
    let api: T
    try {
      const { name, password } = adminCredentials()
      ;({ api } = await login(Client, baseURL, name, password))
    } catch {
      return // server not reachable (e.g. only unit tests ran)
    }
    const prefix = runPrefix()
    try {
      for (const user of await api.listUserNames()) {
        if (!user.startsWith(prefix)) continue
        await options.beforeDeleteUser?.(api, user)
        await api.deleteUser(user)
      }
      for (const project of await api.listProjects()) {
        if (project.name.startsWith(prefix)) await api.deleteProject(project.name)
      }
      for (const group of await api.listAccessGroupNames()) {
        if (group.startsWith(prefix)) await api.deleteAccessGroup(group)
      }
      await options.sweep?.(api, prefix)
    } finally {
      await api.dispose()
    }
  }
