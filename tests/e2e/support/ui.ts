import { Locator, Page } from '@playwright/test'

/** A react-toastify notification containing `text` */
export const toast = (page: Page, text: string | RegExp) =>
  page.locator('.Toastify__toast').filter({ hasText: text }).first()

/**
 * A dialog from @ynput/ayon-react-components, found by its header text.
 * FLAG: that Dialog renders a plain `div.dialog` without role="dialog" or an accessible name,
 * so `getByRole('dialog')` does not work for it.
 */
export const dialog = (page: Page, header: string | RegExp): Locator =>
  page.locator('.dialog').filter({ has: page.locator('.header', { hasText: header }) })

/** primereact confirm dialog (used by confirmDelete) */
export const confirmDialog = (page: Page) => page.locator('.p-confirm-dialog')

/**
 * A menu item by its visible label. Covers both menu implementations in the app:
 * - primereact context menus (`role=menuitem`)
 * - the shared `Menu` dropdowns (`<li aria-label>` inside a list)
 * FLAG: material icon ligatures are not aria-hidden, so accessible names look like "archive Archive";
 * matching the label element avoids depending on the icon name.
 */
export const menuItem = (page: Page, label: string) =>
  page
    .getByRole('menuitem')
    .filter({ has: page.getByText(label, { exact: true }) })
    .or(page.getByRole('listitem', { name: label, exact: true }))
    .first()

/**
 * A `FormRow` from @ynput/ayon-react-components (label on the left, field on the right), by its label.
 * FLAG: FormRow labels are not associated with their fields, so `getByLabel` does not work.
 */
export const formRow = (scope: Page | Locator, label: string) =>
  scope.locator(`div:has(> div.label:text-is(${JSON.stringify(label)})):has(> div.field)`)

/**
 * The clickable body of an `InputSwitch` (@ynput/ayon-react-components) inside `scope`.
 * Assert its state with `scope.getByRole('checkbox')`.
 * FLAG: InputSwitch hides its checkbox (0x0, opacity 0) and gives it no accessible name, so
 * `getByRole('checkbox').check()` never sees it as visible.
 */
export const switchBody = (scope: Locator) => scope.locator('label.switch-body')
