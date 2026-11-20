import { expect, test } from '@playwright/test'
import { parseTypedDay } from '../../shared/src/containers/ProjectTreeTable/widgets/DateWidgetHelpers'

const today = new Date(2026, 10, 20)

test('reads a day typed in a date cell, day first', () => {
  for (const text of [
    '15 Nov 2026',
    ' 15  November 2026 ',
    '2026-11-15',
    '15/11/2026',
    '15-11-2026',
    '15.11.2026',
    '15/11/26',
    '15 Nov',
    '15/11',
  ]) {
    expect(parseTypedDay(text, today), text).toBe('2026-11-15')
  }
  expect(parseTypedDay('1/2/2027', today)).toBe('2027-02-01')
})

test('rejects what is not a day', () => {
  for (const text of ['', '  ', 'nope', '32/1/2026', '15/13/2026', '2026-02-30', '15 Foo 2026']) {
    expect(parseTypedDay(text, today), text).toBeNull()
  }
})
