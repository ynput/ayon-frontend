// Set on the host element while a frame is shown, so the host can hide its static image
export const FILMSTRIP_ACTIVE_ATTRIBUTE = 'data-filmstrip-active'
// Relative position (0-1) in the video of the frame shown, and the video (reviewable) file
export const FILMSTRIP_POSITION_ATTRIBUTE = 'data-filmstrip-position'
export const FILMSTRIP_FILE_ATTRIBUTE = 'data-filmstrip-file-id'

export interface FilmstripTarget {
  position: number // relative position (0-1) in the video
  fileId: string // the reviewable the filmstrip was made from
}

/**
 * The filmstrip frame shown under the cursor, for opening the viewer at the same reviewable
 * and frame the user was looking at.
 * Returns undefined when the event did not come from a scrubbed thumbnail.
 */
export const getFilmstripTarget = (event?: {
  target: EventTarget | null
}): FilmstripTarget | undefined => {
  const target = event?.target
  if (!(target instanceof Element)) return undefined
  const host = target.closest(`[${FILMSTRIP_POSITION_ATTRIBUTE}]`)
  const position = Number(host?.getAttribute(FILMSTRIP_POSITION_ATTRIBUTE))
  const fileId = host?.getAttribute(FILMSTRIP_FILE_ATTRIBUTE)
  if (!host || !Number.isFinite(position) || !fileId) return undefined
  return { position, fileId }
}
