// A menu button names its slot (`data-ayon-trigger`) and nothing else: the slot inspector outlines
// it from the registry, in the colour of the slot's addons, only while Show slots is on.
import { expect, test } from '@playwright/test'
import { build } from 'esbuild'
import path from 'path'

const root = path.join(__dirname, '../..')
const bundle = async () => {
  const result = await build({
    entryPoints: [path.join(__dirname, 'fixtures/slot-trigger/entry.ts')],
    bundle: true,
    write: false,
    format: 'iife',
    jsx: 'automatic',
    define: { 'process.env.NODE_ENV': '"production"' },
    alias: {
      '@ynput/ayon-addon/host': path.join(root, 'addon/src/host.ts'),
      '@ynput/ayon-addon': path.join(root, 'addon/src/index.ts'),
    },
    logLevel: 'silent',
  })
  return result.outputFiles[0].text
}

type Inspector = {
  setSlotInspectorAvailable: (on: boolean) => void
  setShowSlots: (on: boolean) => void
  setAddonHighlighted: (addon: string, on: boolean) => void
}

test("a menu button is outlined from its slot's contributions", async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.setContent('<html><body></body></html>')
  await page.addScriptTag({ content: await bundle() })
  const outline = (id: string) =>
    page.evaluate((id) => {
      const style = getComputedStyle(document.getElementById(id)!)
      return `${style.outlineStyle} ${style.outlineColor}`
    }, id)
  const call = (fn: keyof Inspector, ...args: unknown[]) =>
    page.evaluate(
      ([fn, args]) =>
        (window as never as Record<string, (...a: unknown[]) => void>)[fn as string](
          ...(args as unknown[]),
        ),
      [fn, args] as const,
    )

  expect(await outline('menu')).toBe('none rgb(0, 0, 0)')
  await call('setSlotInspectorAvailable', true)
  await call('setShowSlots', true)
  // the last of AYON, alpha and zebra in the legend's order: zebra, the palette's second colour
  await expect.poll(() => outline('menu')).toBe('dashed rgb(255, 183, 77)')
  // a slot nobody contributes to: its button isn't outlined
  expect(await outline('empty')).toBe('none rgb(0, 0, 0)')
  await call('setAddonHighlighted', 'zebra', false)
  await expect.poll(() => outline('menu')).toBe('dashed rgb(79, 195, 247)')
  await call('setShowSlots', false)
  await expect.poll(() => outline('menu')).toBe('none rgb(0, 0, 0)')
  expect(errors).toEqual([])
})
