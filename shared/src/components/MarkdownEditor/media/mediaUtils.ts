export type MediaKind = 'image' | 'video'

const VIDEO_EXTENSIONS = ['mp4', 'mov', 'webm', 'mkv', 'm4v', 'ogv', 'avi']
const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif', 'bmp']

const getExtension = (value?: string | null) =>
  value?.split(/[?#]/)[0].split('.').pop()?.toLowerCase() || ''

/**
 * Image or video, from the mime type (written as the markdown image title by the editor) or else
 * the file extension of the url / name. Defaults to image, markdown images are images.
 */
export const getMediaKind = (mime?: string | null, ...names: (string | null | undefined)[]) => {
  if (mime?.startsWith('video/')) return 'video'
  if (mime?.startsWith('image/')) return 'image'
  if (names.some((name) => VIDEO_EXTENSIONS.includes(getExtension(name)))) return 'video'
  return 'image'
}

// files that can be shown as a block instead of an attachment
export const isMediaFile = (file: File) =>
  file.type.startsWith('image/') ||
  file.type.startsWith('video/') ||
  [...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS].includes(getExtension(file.name))

const PROJECT_FILE_REGEX = /\/api\/projects\/[^/]+\/files\/([\w-]+)/

// the file id of a project file url (a comment attachment)
export const getProjectFileId = (src?: string | null) => src?.match(PROJECT_FILE_REGEX)?.[1] ?? null

// a standalone markdown image, how the editor stores image / video blocks (see MEDIA)
const MEDIA_LINE_REGEX = /^\s*!\[[^\]]*\]\(<?([^\s)>]+)>?(?:\s+"[^"]*")?\)\s*$/
const FENCE_REGEX = /^\s*(```|~~~)/

/**
 * Ids of the project files shown as image / video blocks in the markdown. Only standalone media
 * images count, not file urls in prose, links or code blocks.
 */
export const getInlineMediaFileIds = (markdown?: string | null): Set<string> => {
  const ids = new Set<string>()
  let inCode = false
  for (const line of String(markdown || '').split('\n')) {
    if (FENCE_REGEX.test(line)) {
      inCode = !inCode
      continue
    }
    if (inCode) continue
    const id = getProjectFileId(line.match(MEDIA_LINE_REGEX)?.[1])
    if (id) ids.add(id)
  }
  return ids
}
