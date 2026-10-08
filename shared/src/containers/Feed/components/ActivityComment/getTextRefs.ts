export interface TextRef {
  type: string
  id: string
}

// Entity references in a comment body: `[label](type:id)` links, web links are skipped
export const getTextRefs = (text = ''): TextRef[] => {
  const links = text.match(/\((.*?)\)/g) || []
  return links.flatMap((link) => {
    // if https, then it is a link and not an entity
    if (link.includes('http')) return []
    const match = link.match(/\(([^)]+)\)/)
    const parts = match ? match[1].split(':') : []
    return { type: parts[0], id: parts[1] }
  })
}
