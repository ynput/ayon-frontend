import { expect, Locator, Page } from '@playwright/test'
import { DetailsPanel } from './DetailsPanel'

export type VideoState = {
  src: string
  readyState: number
  width: number
  height: number
  paused: boolean
  currentTime: number
  error: number | null
}

// FLAG: the viewer `Dialog` (@ynput/ayon-react-components) has no role="dialog" or name; found by id
export class ViewerPage {
  readonly root: Locator
  readonly details: DetailsPanel

  constructor(readonly page: Page) {
    this.root = page.locator('#viewer-dialog')
    this.details = new DetailsPanel(page, this.root.locator('.viewer-details-panel .details-panel'))
  }

  // FLAG: the clickable thumbnail is a div without a role, and the play icon over it blocks the img
  static async openFromThumbnail(panel: DetailsPanel, entityId: string) {
    await panel.root
      .locator('.thumbnail.clickable')
      .filter({ has: panel.page.getByRole('img', { name: `Entity thumbnail ${entityId}` }) })
      .click()
  }

  async expectOpen() {
    await expect(this.root).toBeVisible()
    await expect(this.versionDropdown).toBeVisible()
  }

  async close() {
    await this.root.getByRole('button', { name: 'close', exact: true }).first().click()
    await expect(this.root).toBeHidden()
  }

  get versionDropdown() {
    return this.root.getByRole('button', { name: /^Viewing: / })
  }

  // FLAG: the accessible name is shortcut, version and icon ligature ("D v002 chevron_right")
  get nextVersionButton() {
    return this.root.getByRole('button', { name: /v\d{3} chevron_right$/ })
  }

  get approvedVersionButton() {
    return this.root.getByRole('button', { name: /^Approved - / })
  }

  async expectVersion(name: string) {
    await expect(this.versionDropdown).toHaveText(new RegExp(`Viewing: ${name}`))
    await expect(this.details.root.getByRole('heading', { level: 3 })).toHaveText(name)
  }

  // FLAG: the dropdown list (@ynput/ayon-react-components) is a plain `ul.options` without a listbox role
  async selectVersion(name: string) {
    await this.versionDropdown.click()
    await this.page.locator('.options').getByText(name, { exact: true }).click()
    await this.expectVersion(name)
  }

  // FLAG: the strip cards are divs without role or name (the label is only a tooltip); found by id
  reviewableCard(fileId: string) {
    return this.root.locator(`[id="preview-${fileId}"]`)
  }

  get reviewableCards() {
    return this.root.locator('.reviewable-card')
  }

  // FLAG: the native file input is laid over the upload area without a label, so it is found by CSS
  get uploadInput() {
    return this.root.locator('#upload input[type="file"]').first()
  }

  get video() {
    return this.root.locator('video')
  }

  image(name: string) {
    return this.root.getByRole('img', { name, exact: true })
  }

  async videoState(): Promise<VideoState> {
    return this.video.evaluate((video: HTMLVideoElement) => ({
      src: video.currentSrc,
      readyState: video.readyState,
      width: video.videoWidth,
      height: video.videoHeight,
      paused: video.paused,
      currentTime: video.currentTime,
      error: video.error?.code ?? null,
    }))
  }

  async expectVideo(fileId: string, size: { width: number; height: number }) {
    await expect
      .poll(async () => {
        const { src, readyState, width, height, error } = await this.videoState()
        return { file: src.split('/').pop(), loaded: readyState >= 2, width, height, error }
      })
      .toEqual({ file: fileId, loaded: true, width: size.width, height: size.height, error: null })
  }

  async expectImage(name: string, size: { width: number; height: number }) {
    const image = this.image(name)
    await expect(image).toBeVisible()
    await expect
      .poll(() =>
        image.evaluate((img: HTMLImageElement) => ({
          complete: img.complete,
          width: img.naturalWidth,
          height: img.naturalHeight,
        })),
      )
      .toEqual({ complete: true, width: size.width, height: size.height })
  }

  // FLAG: the player buttons are icon-only, their accessible names are the icon ligatures
  control(icon: 'play_arrow' | 'pause' | 'skip_previous') {
    return this.root.locator('.controls-row').getByRole('button', { name: icon, exact: true })
  }

  // FLAG: the frame fields have no label, only a tooltip
  get frameInput() {
    return this.root.locator('.controls-row input[data-tooltip="Current frame"]')
  }

  get totalFrames() {
    return this.root.locator('.controls-row input[data-tooltip="Total frames"]')
  }

  // FLAG (app bug): a pause within ~100 ms of loading leaves the button on "pause"; play a few frames first
  async pause() {
    await expect(this.control('pause')).toBeVisible()
    await expect.poll(async () => (await this.videoState()).currentTime).toBeGreaterThan(0.2)
    await this.control('pause').click()
    await expect(this.control('play_arrow')).toBeVisible()
    await expect.poll(async () => (await this.videoState()).paused).toBe(true)
  }

  get frameLinkButton() {
    return this.details.root.getByRole('button', { name: 'Add frame link', exact: true })
  }

  async commentOnCurrentFrame(text: string) {
    const frame = await this.frameInput.inputValue()
    await this.details.root.getByText(/^(Leave a comment|Comment, or type)/).click()
    await expect(this.details.commentEditor).toBeVisible()
    await this.details.commentEditor.pressSequentially(text)
    await this.frameLinkButton.click()
    await expect(
      this.details.root.getByRole('button', { name: `Edit linked frame ${frame}`, exact: true }),
    ).toBeVisible()
    await this.details.root.getByRole('button', { name: 'Comment', exact: true }).click()
    await expect(this.details.comment(text)).toBeVisible()
  }

  frameLinkChip(commentText: string) {
    return this.details.comment(commentText).getByTestId('comment-frame-link-chip')
  }

  async goToFrame(frame: number) {
    await this.frameInput.fill(String(frame))
    await this.frameInput.press('Enter')
    await expect(this.frameInput).not.toBeFocused()
    await this.expectFrame(frame)
  }

  async expectFrame(frame: number, fps = 24) {
    await expect(this.frameInput).toHaveValue(String(frame))
    await expect
      .poll(async () => Math.round((await this.videoState()).currentTime * fps) + 1)
      .toBe(frame)
  }
}
