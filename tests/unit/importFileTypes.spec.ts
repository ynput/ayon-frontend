import { expect, test } from '@playwright/test'
import type { ImportFileType } from '@ynput/ayon-addon'
import {
  acceptedFileTypes,
  fileKinds,
  fileTypeToCSV,
  findFileType,
} from '../../src/containers/ImportDialog/fileTypes'

const calendar: ImportFileType = {
  label: 'calendar',
  extensions: ['.ics'],
  mimeTypes: ['text/calendar'],
  toCSV: async (file) => `Label\n${(await file.text()).trim()}`,
}

test.describe('addon file types in the import dialog', () => {
  test('finds the addon type of a file by its name ending or media type', () => {
    expect(findFileType(new File([''], 'work.ics'), [calendar])).toBe(calendar)
    expect(findFileType(new File([''], 'WORK.ICS'), [calendar])).toBe(calendar)
    expect(findFileType(new File([''], 'work', { type: 'text/calendar' }), [calendar])).toBe(
      calendar,
    )
    expect(findFileType(new File([''], 'shots.csv', { type: 'text/csv' }), [calendar])).toBe(
      undefined,
    )
    expect(findFileType(new File([''], 'work.ics'))).toBe(undefined)
  })

  test('offers the addon types next to CSV and Excel', () => {
    expect(acceptedFileTypes([calendar])).toEqual(
      expect.arrayContaining(['.csv', '.xlsx', '.ics', 'text/calendar']),
    )
    expect(acceptedFileTypes()).not.toContain('.ics')
    expect(fileKinds()).toBe('CSV or Excel')
    expect(fileKinds([calendar])).toBe('CSV, Excel or calendar')
  })

  test("reads a file with the addon's code, and shows what it throws as an error", async () => {
    expect(await fileTypeToCSV(calendar, new File(['Standup\n'], 'work.ics'))).toBe(
      'Label\nStandup',
    )
    const broken: ImportFileType = {
      ...calendar,
      toCSV: () => Promise.reject('no VCALENDAR in the file'),
    }
    await expect(fileTypeToCSV(broken, new File([''], 'work.ics'))).rejects.toThrow(
      'no VCALENDAR in the file',
    )
  })
})
