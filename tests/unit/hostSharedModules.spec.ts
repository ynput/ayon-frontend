import { expect, test } from '@playwright/test'
import { readFileSync } from 'fs'
import path from 'path'

const read = (file: string) => readFileSync(path.join(__dirname, '../..', file), 'utf8')

// An entry the host doesn't provide falls back to the addon's own copy, which brings its own
// api and contexts with it, so every published entry has to be provided.
test('the host provides every published @ynput/ayon-frontend-shared entry', () => {
  const libEntries = [...read('shared/vite.config.ts').matchAll(
    /(\w+): resolve\(__dirname, 'src\/([\w/]+)\.ts'\)/g,
  )].map(([, name, file]) => [name, file])

  const hostEntries = [...read('src/remote/hostSharedEntries.ts').matchAll(
    /import \* as (\w+) from '@shared\/([\w/]+)'/g,
  )].map(([, name, file]) => [name, file])

  const listBlock = read('src/remote/hostSharedModules.ts').match(/ENTRY_NAMES = \[([^\]]*)\]/)
  const registeredNames = [...(listBlock?.[1] ?? '').matchAll(/'(\w+)'/g)].map(([, name]) => name)

  expect(libEntries.length).toBeGreaterThan(0)
  expect(hostEntries).toEqual(libEntries)
  expect(registeredNames).toEqual(libEntries.map(([name]) => name))
})
