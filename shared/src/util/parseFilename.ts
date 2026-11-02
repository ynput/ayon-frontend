export const parseFilename = (filename: string) => {
  const parsed = filename.replace(/[^\x00-\xFF]/g, '').trim()
  const nameWithoutExtension = parsed.replace(/\.[^/.]+$/, '')
  const extension = parsed.split('.').pop()

  if (nameWithoutExtension.length === 0) {
    return 'unnamed' + (extension ? `.${extension}` : '')
  }

  return parsed
}
