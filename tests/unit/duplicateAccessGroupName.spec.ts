import { expect, test } from '@playwright/test'
import { getDuplicateAccessGroupName } from '../../src/pages/SettingsPage/AccessGroups/NewAccessGroupHelpers'

test('a copy is named <source>_copy when that name is free', () => {
  expect(getDuplicateAccessGroupName('artist', ['artist', 'client'])).toBe('artist_copy')
})

test('the next free number is added when copies already exist', () => {
  expect(getDuplicateAccessGroupName('artist', ['artist', 'artist_copy'])).toBe('artist_copy2')
  expect(getDuplicateAccessGroupName('artist', ['artist', 'artist_copy', 'artist_copy2'])).toBe(
    'artist_copy3',
  )
})

test('existing names are compared case-insensitively', () => {
  expect(getDuplicateAccessGroupName('Artist', ['artist', 'artist_copy'])).toBe('Artist_copy2')
})
