import { expect, Locator, Page } from '@playwright/test'
import { DetailsPanel } from './DetailsPanel'

/** What the `<video>` element of the viewer is doing right now */
export type VideoState = {
  src: string
  /** HTMLMediaElement.readyState: 2 = the current frame is decoded, 4 = can play through */
  readyState: number
  width: number
  height: number
  paused: boolean
  currentTime: number
  /** MediaError code, null while the media is fine */
  error: number | null
}

/**
 * The review viewer: player, version switcher, reviewables strip and the version's details panel.
 * It is a full window dialog over the page it was opened from (products, details panel, lists).
 * FLAG: the viewer is a `Dialog` from @ynput/ayon-react-components without role="dialog" or a
 * name, so it is found by its id.
 */
export class ViewerPage {
  readonly root: Locator
  /** the version's details panel on the right (status, feed, files) */
  readonly details: DetailsPanel

  constructor(readonly page: Page) {
    this.root = page.locator('#viewer-dialog')
    this.details = new DetailsPanel(page, this.root.locator('.viewer-details-panel .details-panel'))
  }

  /**
   * Open the viewer by clicking the thumbnail in a details panel header (a version with
   * reviewables shows a play icon over it).
   * FLAG: the clickable thumbnail is a div without a role; it is found as the `.thumbnail` around
   * the image named "Entity thumbnail <id>". The play icon covers the image, so the image itself
   * cannot be clicked.
   */
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

  // ---------------------------------------------------------------------------
  // versions
  // ---------------------------------------------------------------------------

  /** "Viewing: v001", opens the list of the product's versions */
  get versionDropdown() {
    return this.root.getByRole('button', { name: /^Viewing: / })
  }

  /**
   * The "next version" button right of the dropdown (shortcut D; A is the previous version).
   * FLAG: its accessible name is the shortcut, the version name and the icon ligature
   * ("D v002 chevron_right").
   */
  get nextVersionButton() {
    return this.root.getByRole('button', { name: /v\d{3} chevron_right$/ })
  }

  /** "Approved - v001" or "Approved - None" (disabled), jumps to the latest approved version */
  get approvedVersionButton() {
    return this.root.getByRole('button', { name: /^Approved - / })
  }

  async expectVersion(name: string) {
    await expect(this.versionDropdown).toHaveText(new RegExp(`Viewing: ${name}`))
    await expect(this.details.root.getByRole('heading', { level: 3 })).toHaveText(name)
  }

  /**
   * Pick a version from the "Viewing: ..." dropdown.
   * FLAG: the dropdown list (@ynput/ayon-react-components) is a plain `ul.options` without a
   * listbox role.
   */
  async selectVersion(name: string) {
    await this.versionDropdown.click()
    await this.page.locator('.options').getByText(name, { exact: true }).click()
    await this.expectVersion(name)
  }

  // ---------------------------------------------------------------------------
  // reviewables (the strip of media cards right of the player)
  // ---------------------------------------------------------------------------

  /**
   * The card of one reviewable in the strip, by its file id. The selected one has the class
   * `selected`.
   * FLAG: the cards are plain divs without a role or name (the label is only a tooltip, and
   * reviewables without a label have none), so they are found by their `preview-<fileId>` id.
   */
  reviewableCard(fileId: string) {
    return this.root.locator(`[id="preview-${fileId}"]`)
  }

  get reviewableCards() {
    return this.root.locator('.reviewable-card')
  }

  /**
   * The file input of the "Drop or click to upload" area a version without reviewables shows.
   * FLAG: the native input is laid over the area without a label, so it is found by CSS.
   */
  get uploadInput() {
    return this.root.locator('#upload input[type="file"]').first()
  }

  // ---------------------------------------------------------------------------
  // media
  // ---------------------------------------------------------------------------

  get video() {
    return this.root.locator('video')
  }

  /** an image reviewable, named by its label or file name */
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

  /**
   * Wait until the player shows this file: the `<video>` loads it from the server and has decoded
   * a frame, so it has its real size.
   */
  async expectVideo(fileId: string, size: { width: number; height: number }) {
    await expect
      .poll(async () => {
        const { src, readyState, width, height, error } = await this.videoState()
        return { file: src.split('/').pop(), loaded: readyState >= 2, width, height, error }
      })
      .toEqual({ file: fileId, loaded: true, width: size.width, height: size.height, error: null })
  }

  /** Wait until an image reviewable is decoded and has its real size */
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

  // ---------------------------------------------------------------------------
  // player controls
  // ---------------------------------------------------------------------------

  /**
   * FLAG: the player buttons are icon-only, their accessible names are the icon ligatures.
   * The play button is "play_arrow" while paused and "pause" while playing.
   */
  control(icon: 'play_arrow' | 'pause' | 'skip_previous') {
    return this.root.locator('.controls-row').getByRole('button', { name: icon, exact: true })
  }

  /**
   * The current frame (1-based) left of the controls; type a frame and press Enter to seek.
   * FLAG: the frame fields have no label, only a tooltip.
   */
  get frameInput() {
    return this.root.locator('.controls-row input[data-tooltip="Current frame"]')
  }

  /** the number of frames of the video, right of the controls (read only) */
  get totalFrames() {
    return this.root.locator('.controls-row input[data-tooltip="Total frames"]')
  }

  /**
   * Pause the playing video and wait for it to stop.
   * FLAG (app bug): a pause in the first ~100 ms after a video loads (while the player is still
   * "transitioning" to the new source) stops the video but leaves the button on "pause":
   * useVideoSeeking.handlePause returns early during the transition and never resets isPlaying.
   * So let the video play a few frames first, like a user would.
   */
  async pause() {
    await expect(this.control('pause')).toBeVisible()
    await expect.poll(async () => (await this.videoState()).currentTime).toBeGreaterThan(0.2)
    await this.control('pause').click()
    await expect(this.control('play_arrow')).toBeVisible()
    await expect.poll(async () => (await this.videoState()).paused).toBe(true)
  }

  // ---------------------------------------------------------------------------
  // comments linked to frames (the feed of the viewer's details panel)
  // ---------------------------------------------------------------------------

  /** the clock button in the comment box that links the comment to the player's current frame */
  get frameLinkButton() {
    return this.details.root.getByRole('button', { name: 'Add frame link', exact: true })
  }

  /** Write a comment linked to the frame the player shows and post it */
  async commentOnCurrentFrame(text: string) {
    const frame = await this.frameInput.inputValue()
    // the comment box is collapsed until clicked
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

  /** The "<clock> 120" chip of a posted comment; clicking it seeks the player to that frame */
  frameLinkChip(commentText: string) {
    return this.details.comment(commentText).getByTestId('comment-frame-link-chip')
  }

  /** Seek to a frame by typing it into the frame field */
  async goToFrame(frame: number) {
    await this.frameInput.fill(String(frame))
    await this.frameInput.press('Enter')
    await expect(this.frameInput).not.toBeFocused()
    await this.expectFrame(frame)
  }

  /**
   * Wait until the player is on a frame (1-based): the frame field shows it and the video is at
   * that frame's time. The field alone is not enough, it keeps what was typed into it.
   */
  async expectFrame(frame: number, fps = 24) {
    await expect(this.frameInput).toHaveValue(String(frame))
    await expect
      .poll(async () => Math.round((await this.videoState()).currentTime * fps) + 1)
      .toBe(frame)
  }
}
