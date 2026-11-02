import { expect, Locator } from '@playwright/test'

/**
 * The summary footer of a project table (overview, products). Its name cell shows the main
 * count, e.g. "9 folders | 5 tasks" or "4 products | 6 versions".
 * The footer is a power feature: it only renders with the power pack addon.
 */
export const summaryNameCell = (table: Locator) => table.locator('tfoot td.name')

/** Parse "9 folders | 1 task" into { folder: 9, task: 1 } */
export const parseMainCount = (text: string): Record<string, number> => {
  const counts: Record<string, number> = {}
  for (const [, count, label] of text.matchAll(/(\d+)\s*([a-z]+)/gi)) {
    counts[label.toLowerCase().replace(/s$/, '')] = Number(count)
  }
  return counts
}

/** The main count once the summary has loaded (no loading shimmer, a number is shown) */
export const readMainCount = async (table: Locator) => {
  const cell = summaryNameCell(table)
  await expect(cell).toBeVisible()
  await expect(cell.locator('.loading')).toHaveCount(0)
  await expect(cell).toHaveText(/\d/)
  return parseMainCount((await cell.textContent()) ?? '')
}

/**
 * Click every collapsed expander in the table until nothing is left to expand,
 * so rows hidden inside collapsed parents are rendered too.
 */
export const expandAllRows = async (table: Locator) => {
  const collapsed = table.locator('tbody td.name .expander', { hasText: 'chevron_right' })
  for (let i = 0; i < 50; i++) {
    const count = await collapsed.count()
    if (!count) return
    await collapsed.first().click()
  }
}

/** The label of every rendered row in the table body, in order */
export const rowLabels = (table: Locator) =>
  table
    .locator('tbody td.name .label')
    .evaluateAll((labels) => labels.map((label) => label.textContent?.trim() ?? ''))
