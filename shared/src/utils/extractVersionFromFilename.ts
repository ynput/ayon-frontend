/**
 * Extracts version number from filename using common versioning patterns
 * Supports patterns like: file_001, file_v1, file_v001_name, file_name_1, etc.
 */
export function extractVersionFromFilename(filename: string): number | null {
  // Remove file extension for cleaner parsing
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '')

  // Define version patterns in order of specificity
  const patterns = [
    // Pattern: file_v001, file_v1, file_v01 (with 'v' prefix)
    /.*[_\-\s]v(\d+)(?:[_\-\s].*|$)/i,

    // Pattern: file_001, file_01, file_1 (at end of filename)
    /.*[_\-\s](\d+)$/,

    // Pattern: file_001_name, file_1_description (version in middle)
    /.*[_\-\s](\d{2,})(?:[_\-\s].*)/,

    // Pattern: 001_file, 1_file (at start of filename)
    /^(\d+)[_\-\s]/,

    // Pattern: fileV1, fileV001 (no separator)
    /.*v(\d+)$/i,

    // Pattern: file1, file001 (number at end, no separator)
    /.*?(\d{2,})$/,
  ]

  for (const pattern of patterns) {
    const match = nameWithoutExt.match(pattern)
    if (match) {
      const versionStr = match[1]
      const version = parseInt(versionStr, 10)

      // Only return valid versions (positive numbers)
      if (!isNaN(version) && version > 0) {
        return version
      }
    }
  }

  return null
}
