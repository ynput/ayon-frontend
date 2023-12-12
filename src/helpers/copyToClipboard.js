import { toast } from 'react-toastify'

const copyToClipboard = (message) => {
  if (!message) return

  try {
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(message)
        .then(() => toast.success(`Copied To Clipboard: "${message}"`))
        .catch((err) => {
          console.error('Could not copy text: ', err)
          toast.error('Could not copy text')
        })
    } else {
      fallbackCopyTextToClipboard(message)
    }
  } catch (error) {
    console.error('Unexpected error: ', error)
  }
}

const fallbackCopyTextToClipboard = (text) => {
  let textarea = document.createElement('textarea')
  textarea.textContent = text
  textarea.style.position = 'fixed' // Prevent scrolling to bottom of page in MS Edge.
  document.body.appendChild(textarea)
  textarea.select()

  try {
    document.execCommand('copy') // Security exception may be thrown by some browsers.
    toast.success(`Copied To Clipboard: "${text}"`)
  } catch (ex) {
    console.warn('Copy to clipboard failed.', ex)
    toast.error('Could not copy text')
  } finally {
    document.body.removeChild(textarea)
  }
}

export default copyToClipboard
