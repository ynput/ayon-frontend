// Show slots turns the slot inspector's tags on and off while developer mode is on: a contribution
// on the page keeps its state (an unsaved form, a running service) through it.
import { expect, test } from '@playwright/test'
import { build } from 'esbuild'
import path from 'path'

const bundle = async () => {
  const result = await build({
    entryPoints: [path.join(__dirname, 'fixtures/contribution-remount/entry.tsx')],
    bundle: true,
    write: false,
    format: 'iife',
    jsx: 'automatic',
    define: { 'process.env.NODE_ENV': '"production"' },
    logLevel: 'silent',
  })
  return result.outputFiles[0].text
}

test('switching the tags while the inspector is available keeps a contribution mounted', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.setContent('<div id="root"></div>')
  await page.addScriptTag({ content: await bundle() })
  const counter = page.locator('#counter')
  await counter.click()
  await expect(counter).toHaveText('1')

  const setTags = (on: boolean) =>
    page.evaluate((value) => (window as never as { setContributionTags: (on: boolean) => void }).setContributionTags(value), on)
  const counts = () => page.evaluate(() => (window as never as { counts: () => object }).counts())

  await setTags(true)
  await expect(page.locator('[data-ayon-contribution="test.content"]')).toHaveCount(1)
  await expect(counter).toHaveText('1')
  await counter.click()
  await setTags(false)
  await expect(page.locator('[data-ayon-contribution]')).toHaveCount(0)
  await expect(counter).toHaveText('2')
  expect(await counts()).toEqual({ mounts: 1, unmounts: 0 })
  expect(errors).toEqual([])
})
