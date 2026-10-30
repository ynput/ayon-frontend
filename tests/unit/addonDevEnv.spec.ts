import { expect, test } from '@playwright/test'
import { mkdtempSync, rmSync, writeFileSync } from 'fs'
import os from 'os'
import path from 'path'
import { ENV_TEMPLATE, loadProjectEnv, requireApiKey } from '../../addon-dev/src/project'

const keys = [
  'ADDON_ENV_TEST_SHELL',
  'ADDON_ENV_TEST_FILE',
  'ADDON_ENV_TEST_MISSING',
  'AYON_API_KEY',
  'AYON_SERVER_URL',
]

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

test('.env.local overrides .env, and both are overridden by the shell', () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'addon-env-'))
  const before = Object.fromEntries(keys.map((key) => [key, process.env[key]]))
  try {
    writeFileSync(path.join(dir, '.env.local'), 'ADDON_ENV_TEST_FILE=from-local\n')
    writeFileSync(
      path.join(dir, '.env'),
      'ADDON_ENV_TEST_FILE=from-file\nADDON_ENV_TEST_MISSING=from-file\n',
    )
    delete process.env.ADDON_ENV_TEST_FILE
    delete process.env.ADDON_ENV_TEST_MISSING
    loadProjectEnv(dir)
    expect(process.env.ADDON_ENV_TEST_FILE).toBe('from-local')
    expect(process.env.ADDON_ENV_TEST_MISSING).toBe('from-file')
  } finally {
    rmSync(dir, { recursive: true, force: true })
    for (const key of keys) {
      if (before[key] === undefined) delete process.env[key]
      else process.env[key] = before[key]
    }
  }
})

test('without a key, the command says where to get one', async () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'addon-env-'))
  try {
    expect(await requireApiKey(dir, 'a-key', false)).toBe('a-key')
    await expect(requireApiKey(dir, undefined, false)).rejects.toThrow('no API key')
    await expect(requireApiKey(dir, undefined, false)).rejects.toThrow('Add Service User')
    await expect(requireApiKey(dir, undefined, false)).rejects.toThrow(path.join(dir, '.env'))
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('the template loads with no key, so the command still asks for one', async () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'addon-env-'))
  const before = Object.fromEntries(keys.map((key) => [key, process.env[key]]))
  try {
    writeFileSync(path.join(dir, '.env'), ENV_TEMPLATE)
    delete process.env.AYON_API_KEY
    loadProjectEnv(dir)
    expect(process.env.AYON_API_KEY ?? '').toBe('')
    await expect(requireApiKey(dir, undefined, false)).rejects.toThrow('no API key')
  } finally {
    rmSync(dir, { recursive: true, force: true })
    for (const key of keys) {
      if (before[key] === undefined) delete process.env[key]
      else process.env[key] = before[key]
    }
  }
})
