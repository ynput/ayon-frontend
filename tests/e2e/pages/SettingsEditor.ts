import { expect, Page } from '@playwright/test'

export class SettingsEditor {
  constructor(readonly page: Page) {}

  // FLAG: section headers are plain divs; a click only selects them, the chevron (or a double click) toggles
  sectionHeader(title: string) {
    return this.page
      .locator('.panel-header')
      .filter({ has: this.page.getByRole('heading', { name: title, exact: true }) })
  }

  async expand(title: string) {
    const toggler = this.sectionHeader(title).locator('.panel-toggler')
    await expect(toggler).toHaveText(/^(chevron_right|expand_more)$/)
    if ((await toggler.textContent()) === 'chevron_right') await toggler.click()
    await expect(toggler).toHaveText('expand_more')
  }

  // FLAG: field labels are not associated with their inputs, so `getByLabel` does not work
  field(schemaId: string) {
    return this.page.locator(`[data-schema-id="${schemaId}"]`)
  }

  textbox(schemaId: string) {
    return this.field(schemaId).getByRole('textbox')
  }

  async fillText(schemaId: string, value: string) {
    const input = this.textbox(schemaId)
    await input.fill(value)
    await input.blur()
  }

  dropdownButton(schemaId: string) {
    return this.field(schemaId).getByRole('button').first()
  }

  async select(schemaId: string, value: string) {
    await this.dropdownButton(schemaId).click()
    await this.page.locator(`.options [data-value="${value}"]`).click()
    await expect(this.page.locator('.options')).toBeHidden()
  }

  // FLAG: multi-select options have no aria-selected, a selected one has `.option-child.selected`
  async setOptions(schemaId: string, ...values: string[]) {
    await this.dropdownButton(schemaId).click()
    const options = this.page.locator('.options li.option')
    await expect(options.first()).toBeVisible()
    for (const value of await options.evaluateAll((els) => els.map((el) => el.dataset.value!))) {
      const option = this.page.locator(`.options li.option[data-value="${value}"]`)
      const selected = option.locator('.option-child.selected')
      const wanted = values.includes(value)
      if ((await selected.count()) > 0 !== wanted) {
        await option.click()
        await expect(selected).toHaveCount(wanted ? 1 : 0)
      }
    }
    await this.page.keyboard.press('Escape')
    await expect(this.page.locator('.options')).toBeHidden()
  }

  // FLAG: the icon search input has no label or placeholder, it is found by its container's class
  async pickIcon(schemaId: string, icon: string) {
    await this.dropdownButton(schemaId).click()
    await this.page.locator('.search input').fill(icon)
    await this.page.locator(`.options [data-value="${icon}"]`).click()
    await expect(this.page.locator('.options')).toBeHidden()
  }

  // FLAG: the color picker is a native `<input type="color">` without an accessible name
  async setColor(schemaId: string, hex: string) {
    const input = this.field(schemaId).locator('input[type="color"]')
    await input.fill(hex)
    await input.blur()
  }

  async addItem(listSchemaId: string) {
    // the list's own "+" button follows its items, so it is the last one (nested lists' come before it)
    await this.field(listSchemaId).getByRole('button', { name: 'add', exact: true }).last().click()
  }

  async removeItem(listSchemaId: string, index: number) {
    await this.field(listSchemaId)
      .getByRole('button', { name: 'delete', exact: true })
      .nth(index)
      .click()
  }

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
    // dnd-kit follows pointer moves, so the mouse moves in steps
    await this.page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, {
      steps: 10,
    })
    await this.page.mouse.up()
  }
}
