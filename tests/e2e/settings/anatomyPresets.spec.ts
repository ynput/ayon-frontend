import { expect, test } from '../fixtures'
import { uniqueName } from '../support/names'
import { AnatomyPresetsPage } from '../pages/AnatomyPresetsPage'

// Anatomy presets are studio wide: every test uses its own uniquely named presets, removes them
// in `finally` and never makes one primary (that would change the anatomy of new projects).
test.describe('anatomy presets', () => {
  test('save the default anatomy as a new preset', async ({ page, api }) => {
    const name = uniqueName('preset')
    try {
      const presets = new AnatomyPresetsPage(page)
      await presets.goto()

      await presets.saveAsNewPreset(name)

      await expect(presets.row(name)).toBeVisible()
      await expect
        .poll(async () => (await api.listAnatomyPresets()).find((p) => p.name === name))
        .toMatchObject({ name, primary: false })
      // it holds the anatomy that was shown, i.e. the built-in default
      const preset = await api.get(`/api/anatomy/presets/${name}`)
      const builtin = await api.get('/api/anatomy/presets/__builtin__')
      expect(preset.folder_types.map((t: any) => t.name)).toEqual(
        builtin.folder_types.map((t: any) => t.name),
      )
    } finally {
      await api.deleteAnatomyPreset(name)
    }
  })

  test('rename a preset', async ({ page, api }) => {
    const name = uniqueName('preset')
    const newName = uniqueName('renamed')
    await api.createAnatomyPreset(name)
    try {
      const presets = new AnatomyPresetsPage(page)
      await presets.goto()

      await presets.renamePreset(name, newName)

      await expect(presets.row(newName)).toBeVisible()
      await expect(presets.row(name)).toBeHidden()
      await expect
        .poll(async () => (await api.listAnatomyPresets()).map((p) => p.name))
        .toContain(newName)
      expect((await api.listAnatomyPresets()).map((p) => p.name)).not.toContain(name)
    } finally {
      await api.deleteAnatomyPreset(name)
      await api.deleteAnatomyPreset(newName)
    }
  })

  // FLAG (app bug): PresetNameDialog keeps its input in `useState(initialValue)` but stays mounted,
  // so the rename dialog never shows the current name (it is empty, or shows the last typed name).
  // fixed in ynput/ayon-frontend#2397, switch back to test() once it is merged
  test.fixme('the rename dialog starts with the current preset name', async ({ page, api }) => {
    const name = uniqueName('preset')
    await api.createAnatomyPreset(name)
    try {
      const presets = new AnatomyPresetsPage(page)
      await presets.goto()

      const nameDialog = await presets.openRenameDialog(name)

      await expect(nameDialog.getByPlaceholder('New preset name')).toHaveValue(name)
    } finally {
      await api.deleteAnatomyPreset(name)
    }
  })

  // FLAG (app bug): "Set as primary" stayed enabled for the built-in default while it was primary.
  // AnatomyPresets looked the default ('_') up in the preset list, where it is never listed.
  // fixed in ynput/ayon-frontend#2401, switch back to test() once it is merged
  test.fixme('"Set as primary" is disabled for the primary preset', async ({ page, api }) => {
    const name = uniqueName('preset')
    await api.createAnatomyPreset(name)
    try {
      // which preset is primary is not the test's to change, so the page sees none of them as
      // primary, which makes the built-in default the primary one
      await page.route('**/api/anatomy/presets', async (route) => {
        if (route.request().method() !== 'GET') return route.continue()
        const response = await route.fetch()
        const { presets: list }: { presets: { primary: boolean }[] } = await response.json()
        await route.fulfill({
          response,
          json: { presets: list.map((p) => ({ ...p, primary: false })) },
        })
      })
      const presets = new AnatomyPresetsPage(page)
      await presets.goto()
      const builtIn = presets.row('AYON default (read only)')
      // selected on load because it is the primary one
      await expect(builtIn).toHaveClass(/\bp-highlight\b/)
      await expect(builtIn).toContainText('check')

      await expect(presets.setAsPrimaryButton).toBeDisabled()

      // other presets can still be made primary
      await presets.select(name)
      await expect(presets.setAsPrimaryButton).toBeEnabled()
    } finally {
      await api.deleteAnatomyPreset(name)
    }
  })

  test('delete a preset', async ({ page, api }) => {
    const name = uniqueName('preset')
    await api.createAnatomyPreset(name)
    try {
      const presets = new AnatomyPresetsPage(page)
      await presets.goto()

      await presets.deletePreset(name)

      await expect(presets.row(name)).toBeHidden()
      await expect
        .poll(async () => (await api.listAnatomyPresets()).map((p) => p.name))
        .not.toContain(name)
    } finally {
      await api.deleteAnatomyPreset(name)
    }
  })
})
