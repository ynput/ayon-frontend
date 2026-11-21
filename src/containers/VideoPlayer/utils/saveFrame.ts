// Save the frame under the playhead as a full resolution image.
// The server extracts it from the source video: GET /api/projects/{project}/files/{fileId}/still?t=
// returns a JPEG of the frame at `t` seconds, at the video's own resolution.

// ffmpeg returns the first frame whose timestamp is at or after `t`. Asking a quarter of a frame
// before the frame starts skips the previous frame, and float rounding of `frame / frameRate`
// can't push the seek onto the next one.
export const getStillTime = (frame: number, frameRate: number): number =>
  Math.max(0, (frame - 0.25) / frameRate)

// `src` is the video's file URL, `/api/projects/{project}/files/{fileId}`
export const getStillUrl = (src: string, frame: number, frameRate: number): string =>
  `${src.split('?')[0]}/still?t=${getStillTime(frame, frameRate).toFixed(6)}`

// `turntable.mp4` at frame index 41 → `turntable_0042.jpg`. The number is the one the player shows
// (the frame index + 1), so the file matches what the user picked.
export const getFrameFileName = (fileName: string | undefined, frame: number): string => {
  const base = (fileName || '').replace(/\.[^./\\]+$/, '').trim() || 'frame'
  return `${base}_${String(frame + 1).padStart(4, '0')}.jpg`
}

// Fetches the image (the access token cookie authorises it, guests included) and saves it under
// `fileName`. A plain link to the URL would open the image in a tab instead of saving it.
export const downloadFrame = async (url: string, fileName: string): Promise<void> => {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Still frame request failed (${response.status})`)
  const blob = await response.blob()

  const objectUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = objectUrl
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  // revoke after the click has started the download
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
}
