import { expect, test } from '@playwright/test'
import { mkdtempSync, rmSync, writeFileSync } from 'fs'
import os from 'os'
import path from 'path'
import { loadProjectEnv } from '../../addon-dev/src/project'

const keys = ['ADDON_ENV_TEST_SHELL', 'ADDON_ENV_TEST_FILE', 'ADDON_ENV_TEST_MISSING']

test('the addon folder .env fills unset variables, and the shell wins', () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'addon-env-'))
  const before = Object.fromEntries(keys.map((key) => [key, process.env[key]]))
  try {
    writeFileSync(
      path.join(dir, '.env'),
      'ADDON_ENV_TEST_SHELL=from-file\nADDON_ENV_TEST_FILE=from-file\n',
    )
    process.env.ADDON_ENV_TEST_SHELL = 'from-shell'
    delete process.env.ADDON_ENV_TEST_FILE
    loadProjectEnv(dir)
    expect(process.env.ADDON_ENV_TEST_SHELL).toBe('from-shell')
    expect(process.env.ADDON_ENV_TEST_FILE).toBe('from-file')
  } finally {
    rmSync(dir, { recursive: true, force: true })
    for (const key of keys) {
      if (before[key] === undefined) delete process.env[key]
      else process.env[key] = before[key]
    }
  }
})

test('a folder without .env is left alone', () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'addon-env-'))
  try {
    expect(() => loadProjectEnv(dir)).not.toThrow()
    expect(process.env.ADDON_ENV_TEST_MISSING).toBeUndefined()
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
