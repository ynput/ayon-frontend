const pasteFromClipboard = async () => {
  // Modern approach with Clipboard API
  if (navigator.clipboard && navigator.clipboard.readText) {
    try {
      const text = await navigator.clipboard.readText()
      return text
    } catch (e) {
      throw new Error('Failed to read or parse clipboard data: ' + e.message)
    }
  } else {
    console.warn('Clipboard API not found, falling back to deprecated execCommand')
    // Fallback using a hidden textarea element
    let textArea = document.createElement('textarea')
    textArea.style.position = 'fixed'
    textArea.style.left = '-9999px'
    document.body.appendChild(textArea)
    textArea.focus()
    document.execCommand('paste')
    let clipboardContent = textArea.value
    document.body.removeChild(textArea)
    return clipboardContent
  }
}

export default pasteFromClipboard
