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
