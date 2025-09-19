import { toast } from 'react-toastify'
import { safeWriteClipboard } from './clipboardUtils'

export const copyToClipboard = async (message: string, toastMessage = false) => {
  if (!message) {
    toast.warn('Nothing to copy')
    return
  }

  try {
    const success = await safeWriteClipboard(message)
    if (success) {
      let toastText = 'Copied To Clipboard'
      if (toastMessage) {
        toastText += `: ${message}`
      }
      toast.success(toastText, { autoClose: 1000 })
    } else {
      // Fallback to legacy method if modern clipboard API fails
      fallbackCopyTextToClipboard(message, toastMessage)
    }
  } catch (error) {
    console.error('Unexpected error: ', error)
    // Fallback to legacy method
    fallbackCopyTextToClipboard(message, toastMessage)
  }
}

const fallbackCopyTextToClipboard = (text: string, toastMessage = false) => {
  let textarea = document.createElement('textarea')
  textarea.textContent = text
  textarea.style.position = 'fixed' // Prevent scrolling to bottom of page in MS Edge.
  document.body.appendChild(textarea)
  textarea.select()

  try {
    document.execCommand('copy') // Security exception may be thrown by some browsers.
    let toastText = 'Copied To Clipboard'
    if (toastMessage) {
      toastText += `: "${text}"`
    }
    toast.success(toastText, {
      autoClose: 100,
    })
  } catch (ex) {
    console.warn('Copy to clipboard failed.', ex)
    toast.error('Could not copy text')
  } finally {
    document.body.removeChild(textarea)
  }
}
