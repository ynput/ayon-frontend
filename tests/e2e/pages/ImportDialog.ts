import { expect, Locator, Page } from '@playwright/test'
import { dialog, switchBody } from '@ynput/ayon-e2e'

export type ImportCounts = {
  created?: number
  updated?: number
  skipped?: number
  errors?: number
}

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

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
  constructor(readonly page: Page, header: string | RegExp = /^Import /) {
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
    await expect(
      this.root.getByText(rows === undefined ? /\d+ rows found/ : `${rows} rows found`),
    ).toBeVisible()
    await this.button('Next').click()
    await expect(this.root.getByRole('columnheader', { name: 'File column' })).toBeVisible()
  }

  /** Step 2 to 3: Map columns, then Review values */
  async continueToValues() {
    await this.button('Continue').click()
    await expect(this.root.getByRole('columnheader', { name: 'Mapped Value' })).toBeVisible()
  }

  /** An option button, e.g. "Update only" or "Skip the row" (its name starts with its icon) */
  private optionButton(label: string) {
    return this.root.getByRole('button', { name: new RegExp(`^\\w+ ${escapeRegExp(label)}$`) })
  }

  async setImportMode(mode: 'Create and update' | 'Update only') {
    await this.optionButton(mode).click()
    await expect(this.optionButton(mode)).toHaveClass(/selected/)
  }

  /** What an Update only import does when a Name matches several entities */
  async setDuplicateStrategy(label: 'Skip the row' | 'Update all of them' | 'Use all of them') {
    await this.optionButton(label).click()
    await expect(this.optionButton(label)).toHaveClass(/selected/)
  }

  /** Go back to an earlier step through the breadcrumbs, e.g. to change the import options */
  async openStep(step: 'Map columns' | 'Review values') {
    await this.root.getByRole('button', { name: new RegExp(`\\d\\. ${step}$`) }).click()
    const header = step === 'Map columns' ? 'File column' : 'Mapped Value'
    await expect(this.root.getByRole('columnheader', { name: header })).toBeVisible()
  }

  /** A row of the Map columns table (by file column) or of Review values (by raw value, "(empty)" for blanks) */
  mapperRow(source: string) {
    return this.root
      .getByRole('row')
      .filter({ has: this.page.getByRole('rowheader', { name: source, exact: true }) })
  }

  /** Picks an option of a mapper dropdown, typing into its search when the list has one */
  private async pick(cell: Locator, label: string) {
    await cell.getByRole('button').first().click()
    const options = this.page.locator('.options')
    await expect(options).toBeVisible()
    const search = this.page.locator('.search input')
    if (await search.count()) await search.fill(label)
    // targets are suffixed with " (required...)" or ' - mapped to "<column>"'
    const option = options.locator('.option').filter({
      has: this.page.getByText(
        new RegExp(`^${escapeRegExp(label)}( \\(required.*\\)| - mapped to ".*")?$`),
      ),
    })
    const takenFrom = (await option.textContent())?.match(/ - mapped to "(.*)"/)?.[1]
    await option.click()
    // a target mapped from another column moves to this one after a confirmation
    if (takenFrom) await this.page.getByRole('button', { name: 'Yes', exact: true }).click()
    await expect(options).toBeHidden()
  }

  private async setAction(row: Locator, action: 'Map' | 'Skip' | 'Create') {
    const cell = row.getByRole('cell').nth(0)
    if (await cell.getByText(action, { exact: true }).count()) return
    await this.pick(cell, action)
    await expect(cell.getByText(action, { exact: true })).toBeVisible()
  }

  /** Map columns: import a file column into a target, by the target's label (e.g. "Start frame") */
  async mapColumn(source: string, target: string) {
    const row = this.mapperRow(source)
    await this.setAction(row, 'Map')
    await this.pick(row.getByRole('cell').nth(1), target)
    await expect(row.getByRole('cell').nth(1)).toContainText(target)
  }

  /** Map columns: leave a file column out of the import */
  async skipColumn(source: string) {
    await this.setAction(this.mapperRow(source), 'Skip')
  }

  /** Review values: show the values of a column, by its target's label (e.g. "Status") */
  async reviewColumn(column: string) {
    const item = this.root
      .getByRole('listbox')
      .getByRole('option')
      .filter({ hasText: new RegExp(`^\\w+\\s*${escapeRegExp(column)}\\s*\\d+ / \\d+$`) })
    await item.click()
    await expect(item).toHaveAttribute('aria-selected', 'true')
  }

  /** Review values: import a raw value of a column as one of the values AYON offers (Yes/No: a boolean) */
  async mapValue(column: string, source: string, target: string | boolean) {
    await this.reviewColumn(column)
    const row = this.mapperRow(source)
    await this.setAction(row, 'Map')
    if (typeof target === 'boolean') {
      const checkbox = row.getByRole('checkbox')
      if ((await checkbox.isChecked()) !== target) await switchBody(row).click()
      await expect(checkbox).toBeChecked({ checked: target })
      return
    }
    await this.pick(row.getByRole('cell').nth(1), target)
    await expect(row.getByRole('cell').nth(1)).toContainText(target)
  }

  /** Review values: leave a raw value out, so rows with it don't set that column */
  async skipValue(column: string, source: string) {
    await this.reviewColumn(column)
    await this.setAction(this.mapperRow(source), 'Skip')
  }

  /** Review values: create a new value (e.g. a folder type) from a raw value, optionally renamed */
  async createValue(column: string, source: string, value?: string) {
    await this.reviewColumn(column)
    const row = this.mapperRow(source)
    await this.setAction(row, 'Create')
    const input = row.getByRole('cell').nth(1).getByRole('textbox')
    if (value !== undefined) await input.fill(value)
    await expect(input).toHaveValue(value ?? source)
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

  /**
   * The reasons the preview (`done` false) or the result gives for skipped rows or rows with
   * errors, `{ [row]: reason }` with rows counted from 1. They are the tooltip of the count.
   */
  async expectRowReasons(
    kind: 'skipped' | 'errors',
    reasons: Record<number, string>,
    done: boolean,
  ) {
    const label = kind === 'errors' ? 'Errors' : done ? 'Skipped' : 'Skipping'
    const stat = this.root.locator('[data-tooltip]').filter({ hasText: `${label}: ` })
    for (const [row, reason] of Object.entries(reasons)) {
      await expect(stat).toHaveAttribute(
        'data-tooltip',
        new RegExp(`(^|\\n)- ${row}: ${escapeRegExp(reason)}(\\n|$)`),
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

  /** Close the wizard with the dialog's X, at any step */
  async dismiss() {
    await this.button('close').click()
    await expect(this.root).toBeHidden()
  }

  /** The whole wizard with the mappings it guesses: upload, both mapping steps unchanged, import */
  async importWithDefaults(
    file: ImportFile,
    preview: ImportCounts,
    result: ImportCounts = preview,
  ) {
    await this.upload(file)
    await this.continueToValues()
    await this.continueToPreview(preview)
    await this.importData(result)
    await this.close()
  }
}
