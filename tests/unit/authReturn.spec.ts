import { expect, test } from '@playwright/test'
import { getAuthReturn } from '../../src/helpers/authReturn'

const ORIGIN = 'https://ayon.example.com'
const search = (value: string) => `?auth_return=${encodeURIComponent(value)}`

test('an address of the authorization server is returned with its query', () => {
  const target = '/api/oauth/authorize?client_id=app&state=a%20b&redirect_uri=http%3A%2F%2Fx'
  expect(getAuthReturn(search(target), ORIGIN)).toBe(target)
  expect(getAuthReturn(search('/api/oauth/apps'), ORIGIN)).toBe('/api/oauth/apps')
})

test('no parameter, no return', () => {
  expect(getAuthReturn('', ORIGIN)).toBeNull()
  expect(getAuthReturn('?auth_redirect=http://localhost:1234', ORIGIN)).toBeNull()
  expect(getAuthReturn('?auth_return=', ORIGIN)).toBeNull()
})

test('anything but the authorization server is refused', () => {
  for (const target of [
    'https://evil.example/api/oauth/authorize',
    '//evil.example/api/oauth/authorize',
    '/\\evil.example/api/oauth/authorize',
    '/api/users/me',
    '/api/auth/logout',
    '/api/oauthx/authorize',
    '/api/oauth', // the prefix needs its slash
    '/api/oauth/../users/me',
    '/api/oauth/%2e%2e/users/me',
    '/projects/demo',
    'javascript:alert(1)',
    'api/oauth/authorize',
  ]) {
    expect(getAuthReturn(search(target), ORIGIN), target).toBeNull()
  }
})
