import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  excelSheetToCSV,
  isExcelFile,
  readExcelSheets,
} from '../../src/containers/ImportDialog/excel'

// Notes (one text column), Empty (no rows) and Shots (text, numbers, a date and a date with time)
const workbook = () =>
  new File([readFileSync(join(__dirname, 'support/importSheets.xlsx'))], 'Shots.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })

test.describe('Excel import', () => {
  test('recognises xlsx files by type or extension', () => {
    expect(isExcelFile(workbook())).toBe(true)
    expect(isExcelFile(new File([''], 'Shots.XLSX'))).toBe(true)
    expect(isExcelFile(new File([''], 'shots.csv', { type: 'text/csv' }))).toBe(false)
  })

  test('lists the sheets with data, in workbook order', async () => {
    const sheets = await readExcelSheets(workbook())
    expect(sheets.map(({ name }) => name)).toEqual(['Notes', 'Shots'])
  })

  test('turns a sheet into CSV with the first row as the header', async () => {
    const sheets = await readExcelSheets(workbook())
    const shots = sheets.find(({ name }) => name === 'Shots')!
    expect(excelSheetToCSV(shots).split('\r\n')).toEqual([
      'Shot,Status,Frames,Due,Review',
      'sh010,In progress,120,2026-10-20,2026-10-20 12:00:00',
      'sh020,"Approved, final",,,',
    ])
  })
})
