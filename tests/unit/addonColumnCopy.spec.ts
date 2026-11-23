import { expect, test } from '@playwright/test'
import { cellCopyText, cellValue, readCellValue } from '../../addon/src/tableColumns'
import {
  clearAddonColumn,
  getAddonColumnEntry,
  getAddonColumnText,
  setAddonColumnEntries,
} from '../../shared/src/containers/ProjectTreeTable/addonColumns/addonColumnValues'

// An addon column's Copy text: fetchValues returns a plain value (copied as text) or
// cellValue(value, { copy }), whose value goes to the cell and copy to the clipboard.

const invoice = { total: 12500, currency: 'EUR', count: 2, status: 'draft' }

test('cellValue keeps the value for the cell and copy for the clipboard', () => {
  const result = readCellValue(cellValue(invoice, { copy: '12500 EUR' }))
  expect(result).toEqual({ value: invoice, copy: '12500 EUR' })
  expect(cellCopyText(result)).toBe('12500 EUR')
})

test('a plain value is the value, copied as before', () => {
  expect(readCellValue('€12,500.00 · Draft')).toEqual({ value: '€12,500.00 · Draft' })
  expect(cellCopyText(readCellValue('€12,500.00 · Draft'))).toBe('€12,500.00 · Draft')
  expect(cellCopyText(readCellValue(3))).toBe('3')
  expect(cellCopyText(readCellValue(false))).toBe('false')
  expect(cellCopyText(readCellValue(['a', 2, { x: 1 }]))).toBe('a, 2')
  expect(cellCopyText(readCellValue(invoice))).toBe('')
  expect(cellCopyText(readCellValue(undefined))).toBe('')
  expect(cellCopyText(readCellValue(null))).toBe('')
})

test("an addon's own { value, copy } object is a plain value, not a cellValue", () => {
  const own = { value: 1, copy: 'x' }
  expect(readCellValue(own)).toEqual({ value: own })
  expect(cellCopyText(readCellValue(own))).toBe('')
})

test('an empty copy is copied as empty, not replaced by the value', () => {
  expect(cellCopyText(readCellValue(cellValue('shown', { copy: '' })))).toBe('')
})

test('a cellValue is plain data: it survives JSON and structuredClone', () => {
  const made = cellValue(invoice, { copy: '12500 EUR' })
  expect(readCellValue(JSON.parse(JSON.stringify(made)))).toEqual({
    value: invoice,
    copy: '12500 EUR',
  })
  expect(readCellValue(structuredClone(made))).toEqual({ value: invoice, copy: '12500 EUR' })
})

test('the column store copies the copy text, else the value', () => {
  const columnId = 'addon__invoices__totals'
  setAddonColumnEntries(columnId, {
    a: { status: 'loaded', version: '1', ...readCellValue(cellValue(invoice, { copy: '12500 EUR' })) },
    b: { status: 'loaded', version: '1', ...readCellValue('plain') },
  })
  expect(getAddonColumnEntry(columnId, 'a')?.value).toEqual(invoice)
  expect(getAddonColumnText(columnId, 'a')).toBe('12500 EUR')
  expect(getAddonColumnText(columnId, 'b')).toBe('plain')
  expect(getAddonColumnText(columnId, 'missing')).toBe('')
  clearAddonColumn(columnId)
})
