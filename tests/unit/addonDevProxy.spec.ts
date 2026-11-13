// The dev server's proxy to AYON (`ayon-addon dev`): which requests it signs in with the API key.
import { expect, test } from '@playwright/test'
import { mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { currentApiKey, proxyApiKey } from '../../addon-dev/src/project'

test.describe('dev server proxy', () => {
  test('adds the key only to requests that are not signed in', () => {
    const key = () => 'fresh'
    expect(proxyApiKey({}, key)).toBe('fresh')
    expect(proxyApiKey({ cookie: 'theme=dark' }, key)).toBe('fresh')
    // signed in on the page: the server checks x-api-key first, a key would override the user
    expect(proxyApiKey({ authorization: 'Bearer abc' }, key)).toBeUndefined()
    expect(proxyApiKey({ cookie: 'theme=dark; accessToken=abc' }, key)).toBeUndefined()
    expect(proxyApiKey({ cookie: 'accessToken=abc' }, key)).toBeUndefined()
    // the page's own key (a headless browser of `ayon-addon open`)
    expect(proxyApiKey({ 'x-api-key': 'own' }, key)).toBeUndefined()
    expect(proxyApiKey({}, () => undefined)).toBeUndefined()
  })

  test('reads the key file again, so a regenerated key is used', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'addon-key-'))
    const file = path.join(dir, 'local-api-key')
    writeFileSync(file, 'first\n')
    const connection = { serverUrl: 'http://localhost:5100', apiKey: 'first', apiKeySource: file, apiKeyFile: file }
    expect(currentApiKey(connection)).toBe('first')
    writeFileSync(file, 'second\n')
    expect(currentApiKey(connection)).toBe('second')
    rmSync(file)
    expect(currentApiKey(connection)).toBeUndefined()
    // from AYON_API_KEY: as given
    expect(currentApiKey({ serverUrl: '', apiKey: 'env', apiKeySource: 'AYON_API_KEY' })).toBe('env')
  })
})
