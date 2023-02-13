import { toast } from 'react-toastify'

const copyToClipboard = (message) => {
  //  Check if the message is empty
  if (!message) return
  //  Check if the browser supports the clipboard API
  if (!navigator.clipboard) return

  navigator.clipboard.writeText(message)
  toast.info(`Copied To Clipboard: "${message}"`)
}

export default copyToClipboard
