import { expect, Page } from '@playwright/test'

/**
 * The schema driven settings form (src/containers/SettingsEditor). It renders access group
 * permissions, anatomy (presets and project anatomy) and addon settings.
 */
export class SettingsEditor {
  constructor(readonly page: Page) {}

  /**
   * Header of a collapsible section, by its title.
   * FLAG: section headers are plain divs, not buttons or disclosure widgets; a single click only
   * selects them, the chevron icon (or a double click) toggles them.
   */
  sectionHeader(title: string) {
    return this.page
      .locator('.panel-header')
      .filter({ has: this.page.getByRole('heading', { name: title, exact: true }) })
  }

  /** Expand a section (expanded sections are remembered per browser session) */
  async expand(title: string) {
    const toggler = this.sectionHeader(title).locator('.panel-toggler')
    await expect(toggler).toHaveText(/^(chevron_right|expand_more)$/)
    if ((await toggler.textContent()) === 'chevron_right') await toggler.click()
    await expect(toggler).toHaveText('expand_more')
  }

  /**
   * A field by its schema path, e.g. `root_attributes_fps`.
   * FLAG: field labels are not associated with their inputs, so `getByLabel` does not work.
   */
  field(schemaId: string) {
    return this.page.locator(`[data-schema-id="${schemaId}"]`)
  }

  // ---------------------------------------------------------------------------
  // editing fields (text fields and color pickers commit on blur)
  // ---------------------------------------------------------------------------

  /** The input of a text field, e.g. `textbox('root_statuses_0_name')` */
  textbox(schemaId: string) {
    return this.field(schemaId).getByRole('textbox')
  }

  /** Replace the value of a text field */
  async fillText(schemaId: string, value: string) {
    const input = this.textbox(schemaId)
    await input.fill(value)
    await input.blur()
  }

  /** The button that opens the dropdown of a select, icon or multi-select field */
  dropdownButton(schemaId: string) {
    return this.field(schemaId).getByRole('button').first()
  }

  /** Pick one option of a select field by its value (not its label), e.g. `select(id, 'blocked')` */
  async select(schemaId: string, value: string) {
    await this.dropdownButton(schemaId).click()
    await this.page.locator(`.options [data-value="${value}"]`).click()
    await expect(this.page.locator('.options')).toBeHidden()
  }

  /**
   * Toggle options of a multi-select field by their values, then close it.
   * The selection is applied on every click; Escape only closes the dropdown.
   */
  async toggleOptions(schemaId: string, ...values: string[]) {
    await this.dropdownButton(schemaId).click()
    for (const value of values) await this.page.locator(`.options [data-value="${value}"]`).click()
    await this.page.keyboard.press('Escape')
    await expect(this.page.locator('.options')).toBeHidden()
  }

  /**
   * Pick a material icon in an icon field, searching for it by name.
   * FLAG: the icon search input has no label or placeholder, it is found by its container's class.
   */
  async pickIcon(schemaId: string, icon: string) {
    await this.dropdownButton(schemaId).click()
    await this.page.locator('.search input').fill(icon)
    await this.page.locator(`.options [data-value="${icon}"]`).click()
    await expect(this.page.locator('.options')).toBeHidden()
  }

  /**
   * Set a color field to a `#rrggbb` value.
   * FLAG: the color picker is a native `<input type="color">` without an accessible name.
   */
  async setColor(schemaId: string, hex: string) {
    const input = this.field(schemaId).locator('input[type="color"]')
    await input.fill(hex)
    await input.blur()
  }

  // ---------------------------------------------------------------------------
  // lists (statuses, task types, tags, ...): items are addressed by index, `<list>_<index>_<field>`
  // ---------------------------------------------------------------------------

  /**
   * Add an empty item at the end of a list, e.g. `addItem('root_statuses')`.
   * The list's own "+" button follows its items, so it is the last one (nested lists come before it).
   */
  async addItem(listSchemaId: string) {
    await this.field(listSchemaId).getByRole('button', { name: 'add', exact: true }).last().click()
  }

  /** Remove the item at `index` with its delete button (icon-only, named after its "delete" icon) */
  async removeItem(listSchemaId: string, index: number) {
    await this.field(listSchemaId)
      .getByRole('button', { name: 'delete', exact: true })
      .nth(index)
      .click()
  }

  /**
   * Drag the item at `from` by its handle onto the item at `to`.
   * The list is sortable with dnd-kit, which follows pointer moves, so the mouse moves in steps.
   */
  async moveItem(listSchemaId: string, from: number, to: number) {
    const handles = this.field(listSchemaId).getByRole('button', {
      name: 'drag_indicator',
      exact: true,
    })
    const source = await handles.nth(from).boundingBox()
    const target = await handles.nth(to).boundingBox()
    if (!source || !target) throw new Error(`list ${listSchemaId} has no items ${from} and ${to}`)
    await this.page.mouse.move(source.x + source.width / 2, source.y + source.height / 2)
    await this.page.mouse.down()
    await this.page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, {
      steps: 10,
    })
    await this.page.mouse.up()
  }
}
