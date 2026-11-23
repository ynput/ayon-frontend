import { menuItem } from '@ynput/ayon-e2e'
import { expect, test } from '../fixtures'
import { OverviewPage } from '../pages/OverviewPage'
import { DetailsPanel } from '../pages/DetailsPanel'

test.describe('details panel picture in picture', () => {
  test('edit a task from the picture-in-picture window', async ({ page, api, projectName }) => {
    const folder = await api.createFolder(projectName, { name: 'sh010', folderType: 'Shot' })
    const task = await api.createTask(projectName, {
      folderId: folder.id,
      name: 'layout',
      taskType: 'Layout',
    })

    const overview = new OverviewPage(page)
    await overview.goto(projectName)
    await overview.expand('sh010')
    const panel = await overview.openDetails('layout')

    // the panel opens in a document picture-in-picture window, as the app in an iframe
    const pipOpened = page.context().waitForEvent('page')
    await panel.root.getByRole('button', { name: 'More actions' }).click()
    await menuItem(page, 'Picture in picture').click()
    const pip = await pipOpened
    const frame = pip.frameLocator('[data-testid="details-pip-frame"]')
    const pipPanel = new DetailsPanel(pip, frame.locator('.details-panel'))
    // the first load of the app in the frame is slow on a cold dev server
    await expect(pipPanel.header).toContainText('layout', { timeout: 30_000 })

    // a dropdown: its options open in the PiP window, not the main one
    await pipPanel.priorityDropdown.click()
    await frame.locator('.options [data-value="urgent"]').first().click()
    await expect(pipPanel.priorityDropdown).toContainText('Urgent')
    await expect
      .poll(async () => (await api.getTask(projectName, task.id)).attrib.priority)
      .toBe('urgent')

    await pipPanel.addComment('from the pip window')

    // the main window follows both changes
    await expect(panel.priorityDropdown).toContainText('Urgent')
    await expect(panel.comment('from the pip window')).toBeVisible()

    // a PiP window cannot open another one
    await pipPanel.root.getByRole('button', { name: 'More actions' }).click()
    await expect(frame.getByText('View data', { exact: true })).toBeVisible()
    await expect(frame.getByText('Picture in picture', { exact: true })).toHaveCount(0)
    await pipPanel.root.getByRole('button', { name: 'More actions' }).click()

    // the panel's own close button closes the PiP window, the main window keeps its panel
    const pipClosed = pip.waitForEvent('close')
    await pipPanel.root.getByRole('button', { name: 'close', exact: true }).first().click()
    await pipClosed
    await expect(panel.header).toContainText('layout')
  })
})
