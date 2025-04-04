import { toast } from 'react-toastify'

const copyToClipboard = (message, toastMessage = false) => {
  if (!message) {
    toast.warn('Nothing to copy')
    return
  }

  try {
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(message)
        .then(() => {
          let toastText = 'Copied To Clipboard'
          if (toastMessage) {
            toastText += `: ${message}`
          }
          toast.success(toastText, { autoClose: 1000 })
        })
        .catch((err) => {
          console.error('Could not copy text: ', err)
          toast.error('Could not copy text')
        })
    } else {
      fallbackCopyTextToClipboard(message, toastMessage)
    }
  } catch (error) {
    console.error('Unexpected error: ', error)
  }
}

const fallbackCopyTextToClipboard = (text, toastMessage = false) => {
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

export default copyToClipboard
