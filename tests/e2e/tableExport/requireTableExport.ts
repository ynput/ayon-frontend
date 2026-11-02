import { test } from '@playwright/test'
import { AyonApi } from '../support/api'
import { requireAddon } from '../support/addons'

/** Skips unless the licensed production Power Pack ships the table export module */
export const requireTableExport = async (api: AyonApi) => {
  const version = await requireAddon(api, 'powerpack', { license: true })
  const modules: { addonName: string; addonVersion: string; modules: Record<string, string[]> }[] =
    await api.get('/api/frontendModules')
  const powerpack = modules.find((m) => m.addonName === 'powerpack' && m.addonVersion === version)
  test.skip(
    !powerpack?.modules.tableExport?.includes('TableExportApp'),
    `needs a Power Pack with the table export (production has ${version})`,
  )
}
