import { FullConfig, request } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { PARTIAL_DIR } from './perfResults'

/**
 * Logs in through the API (no UI) and writes a storage state with the access token,
 * the same way the app stores it after a password login.
 * Uses PERF_TOKEN when set, otherwise NAME / PASSWORD (as in .env.local).
 */
export default async function globalSetup(config: FullConfig) {
  fs.rmSync(PARTIAL_DIR, { recursive: true, force: true })

  const { baseURL, storageState } = config.projects[0].use
  if (!baseURL || typeof storageState !== 'string') throw new Error('perf config needs baseURL')

  let token = process.env.PERF_TOKEN
  if (!token) {
    if (!process.env.NAME || !process.env.PASSWORD) {
      throw new Error('Set PERF_TOKEN, or NAME and PASSWORD, to run the page load benchmarks')
    }
    const api = await request.newContext({ baseURL })
    const res = await api.post('/api/auth/login', {
      data: { name: process.env.NAME, password: process.env.PASSWORD },
    })
    if (!res.ok()) throw new Error(`Login failed: ${res.status()} ${await res.text()}`)
    token = (await res.json()).token as string
    await api.dispose()
  }

  const { hostname, origin } = new URL(baseURL)
  const state = {
    cookies: [
      {
        name: 'accessToken',
        value: token,
        domain: hostname,
        path: '/',
        expires: Math.floor(Date.now() / 1000) + 86400,
        httpOnly: false,
        secure: false,
        sameSite: 'Lax' as const,
      },
    ],
    origins: [{ origin, localStorage: [{ name: 'accessToken', value: token }] }],
  }

  fs.mkdirSync(path.dirname(storageState), { recursive: true })
  fs.writeFileSync(storageState, JSON.stringify(state, null, 2))
}
