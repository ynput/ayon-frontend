import { FullConfig } from '@playwright/test'
import { AyonApi } from './support/api'
import { adminCredentials } from './support/env'
import { runPrefix } from './support/names'

/**
 * Safety net: every fixture cleans up after itself, but a crashed worker or an interrupted run can
 * leave data behind. Remove whatever this run created that is still around.
 */
export default async function globalTeardown(config: FullConfig) {
  const baseURL = config.projects.find((p) => p.name === 'chromium')?.use.baseURL
  if (!baseURL) return
  let api: AyonApi
  try {
    ;({ api } = await AyonApi.login(baseURL, adminCredentials().name, adminCredentials().password))
  } catch {
    return // server not reachable (e.g. only unit tests ran)
  }
  const prefix = runPrefix()
  try {
    for (const project of await api.listProjects()) {
      if (project.name.startsWith(prefix)) await api.deleteProject(project.name)
    }
    for (const user of await api.listUserNames()) {
      if (user.startsWith(prefix)) await api.deleteUser(user)
    }
    for (const group of await api.listAccessGroupNames()) {
      if (group.startsWith(prefix)) await api.deleteAccessGroup(group)
    }
    for (const secret of await api.listSecretNames()) {
      if (secret.startsWith(prefix)) await api.deleteSecret(secret)
    }
    for (const preset of await api.listAnatomyPresets()) {
      if (preset.name.startsWith(prefix)) await api.deleteAnatomyPreset(preset.name)
    }
  } finally {
    await api.dispose()
  }
}
