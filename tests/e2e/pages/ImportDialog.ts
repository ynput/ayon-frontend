import { expect, Locator, Page } from '@playwright/test'
import { dialog } from '@ynput/ayon-e2e'

export type ImportCounts = {
  created?: number
  updated?: number
  skipped?: number
  errors?: number
}

/** A file to import: a path on disk, or a file made in the test */
export type ImportFile = string | { name: string; mimeType: string; buffer: Buffer }

/** A CSV file made in the test, so its rows can use the test's unique names */
export const csvFile = (name: string, rows: (string | number)[][]): ImportFile => ({
  name,
  mimeType: 'text/csv',
  buffer: Buffer.from(
    rows
      .map((row) =>
        row
          .map((cell) => {
            const text = String(cell)
            return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
          })
          .join(','),
      )
      .join('\n'),
  ),
})

/**
 * AYON's import wizard (src/containers/ImportDialog), the same on every page that imports:
 * 1. Upload file, 2. Map columns, 3. Review values, 4. Preview result, 5. Import data.
 * Each page opens it its own way (see the page objects); this covers the steps inside it.
 */
export class ImportDialog {
  readonly root: Locator

  /** `header` is the dialog's heading, e.g. /^Import folders and tasks/ or /^Import users/ */
  constructor(
    readonly page: Page,
    header: string | RegExp = /^Import /,
  ) {
    this.root = dialog(page, header)
  }

  button(name: string) {
    return this.root.getByRole('button', { name, exact: true })
  }

  // FLAG: the file input is hidden behind the "Choose a CSV or Excel file" button, so it is set directly
  /** Step 1: pick the file and go on to Map columns */
  async upload(file: ImportFile, { rows }: { rows?: number } = {}) {
    await expect(this.root).toBeVisible()
    await this.root.locator('input[type="file"]').setInputFiles(file)
    await expect(this.root.getByText(rows === undefined ? /\d+ rows found/ : `${rows} rows found`)).toBeVisible()
    await this.button('Next').click()
    await expect(this.root.getByRole('columnheader', { name: 'File column' })).toBeVisible()
  }

  /** Step 2 to 3: Map columns, then Review values */
  async continueToValues() {
    await this.button('Continue').click()
    await expect(this.root.getByRole('columnheader', { name: 'Mapped Value' })).toBeVisible()
  }

  /** Step 3 to 4: Review values, then Preview result, which shows the counts the server expects */
  async continueToPreview(counts?: ImportCounts) {
    await this.button('Continue').click()
    await expect(this.button('Import data')).toBeEnabled({ timeout: 30_000 })
    if (counts) await this.expectCounts(counts, false)
  }

  /** The created / updated / skipped / errors counts of the preview (`done` false) or the result */
  async expectCounts(counts: ImportCounts, done: boolean) {
    const labels = {
      created: done ? 'Created' : 'Creating',
      updated: done ? 'Updated' : 'Updating',
      skipped: done ? 'Skipped' : 'Skipping',
      errors: 'Errors',
    } as const
    for (const [key, count] of Object.entries(counts)) {
      await expect(this.root).toContainText(
        new RegExp(`${labels[key as keyof ImportCounts]}: ${count}(?!\\d)`),
      )
    }
  }

  /** Step 4 to 5: import, wait until it is finished and check the result's counts */
  async importData(counts?: ImportCounts) {
    await this.button('Import data').click()
    await expect(this.root.getByText('Import finished')).toBeVisible({ timeout: 30_000 })
    if (counts) await this.expectCounts(counts, true)
  }

  async close() {
    await this.button('Close').click()
    await expect(this.root).toBeHidden()
  }

  /** The whole wizard with the mappings it guesses: upload, both mapping steps unchanged, import */
  async importWithDefaults(file: ImportFile, preview: ImportCounts, result: ImportCounts = preview) {
    await this.upload(file)
    await this.continueToValues()
    await this.continueToPreview(preview)
    await this.importData(result)
    await this.close()
  }
}
