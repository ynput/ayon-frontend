import { readFile } from 'fs/promises'
import { expect, Locator, Page } from '@playwright/test'
import { menuItem } from '@ynput/ayon-e2e'
import { readCsv, readXlsx } from '../support/spreadsheet'

export type ExportedFile = {
  fileName: string
  /** the header row first, every cell as text */
  rows: string[][]
  /** the downloaded file */
  data: Buffer
}

const DELIMITERS = { Comma: ',', Semicolon: ';', Tab: '\t' } as const
export type Delimiter = keyof typeof DELIMITERS

/**
 * The Power Pack table export dialog (overview, products, lists and review sessions).
 * It is opened through the `tableExport` URL search param and downloads the file the server builds.
 */
export class ExportDialog {
  readonly root: Locator
  private delimiter: Delimiter = 'Comma'

  constructor(readonly page: Page) {
    // FLAG: the Dialog has no role or accessible name; its "Whole table" option is unique to it
    this.root = page
      .locator('.dialog')
      .filter({ has: page.getByRole('radio').filter({ hasText: 'Whole table' }) })
  }

  /** The toolbar's Export button, or Export in its Import / Export menu */
  async openFromToolbar() {
    const menuButton = this.page.getByTestId('table-import-export')
    const exportButton = this.page.getByRole('button', { name: 'download Export', exact: true })
    await expect(menuButton.or(exportButton)).toBeVisible({ timeout: 30_000 })
    if (await menuButton.isVisible()) {
      await menuButton.click()
      await menuItem(this.page, 'Export').click()
    } else {
      await exportButton.click()
    }
    await this.expectOpen('table')
  }

  /** "Export" in the context menu of a selected cell */
  async openFromContextMenu(cell: Locator) {
    await cell.click({ button: 'right' })
    await menuItem(this.page, 'Export').click()
    await this.expectOpen('selection')
  }

  async expectOpen(scope: 'table' | 'selection') {
    await expect(this.root).toBeVisible({ timeout: 30_000 })
    await expect(this.page).toHaveURL(new RegExp(`[?&]tableExport=${scope}\\b`))
  }

  // FLAG: the option cards are buttons with role="radio" whose name also holds the icon ligature and description
  option(title: string) {
    return this.root.getByRole('radio').filter({ has: this.page.getByText(title, { exact: true }) })
  }

  /** Pick option cards by their title: rows, format and content */
  async choose(...titles: string[]) {
    for (const title of titles) {
      await this.option(title).click()
      await expect(this.option(title)).toHaveAttribute('aria-checked', 'true')
    }
  }

  async expectChosen(...titles: string[]) {
    for (const title of titles)
      await expect(this.option(title)).toHaveAttribute('aria-checked', 'true')
  }

  async setDelimiter(label: Delimiter) {
    // FLAG: the delimiter dropdown has no label, it follows the "Separated by" text
    await this.root
      .getByText('Separated by', { exact: true })
      .locator('xpath=following-sibling::*[1]')
      .click()
    await this.page.locator(`.options [data-value="${DELIMITERS[label]}"]`).click()
    this.delimiter = label
  }

  toggle(label: string) {
    return this.root.getByRole('button').filter({ hasText: label })
  }

  /** Flip a switch (import columns, all visible columns) to `on` */
  async setSwitch(label: string, on: boolean) {
    const toggle = this.toggle(label)
    if ((await toggle.getAttribute('class'))?.split(' ').includes('selected') !== on)
      await toggle.click()
    if (on) await expect(toggle).toHaveClass(/\bselected\b/)
    else await expect(toggle).not.toHaveClass(/\bselected\b/)
  }

  async useImportSettings() {
    await this.root.getByRole('button', { name: 'Use import settings', exact: true }).click()
    await expect(this.root.getByText('Import CSV can read this file back.')).toBeVisible()
    // import settings keep a comma or semicolon and replace tabs with commas
    if (this.delimiter === 'Tab') this.delimiter = 'Comma'
  }

  /** Click "Export Excel" / "Export CSV", wait for the download and read the file */
  async export(): Promise<ExportedFile> {
    const button = this.root.getByRole('button', { name: /^download Export (Excel|CSV)$/ })
    const [download] = await Promise.all([this.page.waitForEvent('download'), button.click()])
    // the dialog closes and clears the search param once the file is downloaded
    await expect(this.root).toBeHidden()
    await expect(this.page).not.toHaveURL(/[?&]tableExport=/)
    const data = await readFile((await download.path())!)
    const fileName = download.suggestedFilename()
    return {
      fileName,
      rows: fileName.endsWith('.xlsx') ? readXlsx(data) : readCsv(data, DELIMITERS[this.delimiter]),
      data,
    }
  }
}

/** A column of an exported file, by its header */
export const column = (file: ExportedFile, header: string) => {
  const index = file.rows[0].indexOf(header)
  if (index < 0) throw new Error(`no "${header}" column in ${JSON.stringify(file.rows[0])}`)
  return file.rows.slice(1).map((row) => row[index])
}

/** Only these columns of an exported file, header row included, in the given order */
export const pick = (file: ExportedFile, headers: string[]) => {
  const indexes = headers.map((header) => {
    const index = file.rows[0].indexOf(header)
    if (index < 0) throw new Error(`no "${header}" column in ${JSON.stringify(file.rows[0])}`)
    return index
  })
  return file.rows.map((row) => indexes.map((index) => row[index]))
}

/**
 * The export's header starts with the table's column headers, left to right, without the ones the
 * export skips (thumbnails). Columns scrolled out of view are not rendered, so they are not compared.
 * FLAG: a sorted header also shows its sort icon and index, so only the first line is its label.
 */
export const expectTableHeaders = async (file: ExportedFile, table: Locator) => {
  const headers = (await table.locator('thead th[data-column-id]').allInnerTexts())
    .map((text) => text.split('\n')[0].trim())
    .filter((text) => text && text !== 'Thumbnail')
  expect(headers.length).toBeGreaterThan(1)
  expect(file.rows[0].slice(0, headers.length)).toEqual(headers)
}

/** `<project>-<table|selection>-<local date>.<extension>` */
export const exportFileName = (
  projectName: string,
  scope: 'table' | 'selection',
  extension: 'xlsx' | 'csv' | 'tsv',
) => {
  const date = new Date().toLocaleDateString('sv')
  return `${projectName}-${scope}-${date}.${extension}`
}
