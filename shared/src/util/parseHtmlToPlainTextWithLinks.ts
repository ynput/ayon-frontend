export const parseHtmlToPlainTextWithLinks = (html: string) => {
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = html

  const result: Array<{ type: 'text' | 'url', content: string, href?: string, key: number }> = []
  let keyCounter = 0

  const processNode = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || ''
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element

      if (element.tagName === 'A') {
        const href = element.getAttribute('href')
        const text = element.textContent || ''
        if (href && text) {
          result.push({
            type: 'url',
            content: text,
            href: href,
            key: keyCounter++
          })
          return `__LINK_${keyCounter - 1}__`
        }
        return text
      }

      if (element.tagName === 'LI') {
        const text = Array.from(element.childNodes).map(processNode).join('').trim()
        return text ? `• ${text}` : ''
      }

      if (element.tagName === 'OL' || element.tagName === 'UL') {
        const items = Array.from(element.children)
          .filter(child => child.tagName === 'LI')
          .map(processNode)
          .filter(text => text.trim())
        return items.join('\n')
      }

      if (element.tagName === 'P') {
        const content = Array.from(element.childNodes).map(processNode).join('')
        return content.trim() ? content + '\n' : ''
      }

      if (element.tagName === 'BR') {
        return '\n'
      }

      return Array.from(element.childNodes).map(processNode).join('')
    }

    return ''
  }

  let plainText = processNode(tempDiv)

  plainText = plainText
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim()

  const parts: Array<{ type: 'text' | 'url', content: string, href?: string, key: number }> = []
  let currentText = plainText
  let finalKeyCounter = 0

  result.forEach((link) => {
    const placeholder = `__LINK_${link.key}__`
    const parts_temp = currentText.split(placeholder)

    if (parts_temp.length > 1) {
      if (parts_temp[0]) {
        parts.push({
          type: 'text',
          content: parts_temp[0],
          key: finalKeyCounter++
        })
      }

      parts.push({
        type: 'url',
        content: link.content,
        href: link.href,
        key: finalKeyCounter++
      })

      currentText = parts_temp.slice(1).join(placeholder)
    }
  })

  if (currentText) {
    parts.push({
      type: 'text',
      content: currentText,
      key: finalKeyCounter++
    })
  }

  return parts.length > 0 ? parts : [{ type: 'text' as const, content: plainText, key: 0 }]
}


