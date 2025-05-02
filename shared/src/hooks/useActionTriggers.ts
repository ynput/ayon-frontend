import { useNavigate, useSearchParams } from 'react-router-dom'

interface QueryParams {
  [key: string]: string
}

interface ActionPayload {
  __queryParams?: QueryParams // adds query params to the URL
  __navigate?: string // navigates to a different page
  __download?: string // triggers a file download from a URL
  __copy?: string // copies string content to clipboard
  [key: string]: any
}

export const useActionTriggers = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const handleActionPayload = (payload: ActionPayload | null): void => {
    if (!payload) return

    // Handle query parameters
    if ('__queryParams' in payload) {
      // Validate it is an object of key:value pairs with value being string
      const isValid = Object.values(payload.__queryParams as QueryParams).every((value) => {
        return typeof value === 'string'
      })

      if (!isValid) {
        throw new Error('Invalid payload: __queryParams')
      } else {
        // Add query params to URL
        for (const [key, value] of Object.entries(payload.__queryParams as QueryParams)) {
          searchParams.set(key, value)
        }
        setSearchParams(searchParams)
      }
    }

    if ('__navigate' in payload) {
      // Validate it is a string
      if (typeof payload.__navigate !== 'string') {
        throw new Error('Invalid payload: __navigate')
      } else {
        // Navigate to the specified page
        navigate(payload.__navigate)
      }
    }

    if ('__download' in payload) {
      // Validate it is a string
      if (typeof payload.__download !== 'string') {
        throw new Error('Invalid payload: __download')
      } else {
        // Trigger file download from the URL
        const downloadUrl = new URL(payload.__download, window.location.origin).href
        console.log(downloadUrl)
        // Create a hidden anchor element
        const link = document.createElement('a')
        link.href = downloadUrl
        link.target = '_blank'
        link.rel = 'noopener noreferrer'
        // Set download attribute if it's a direct file download
        // If it's an API endpoint that handles the download, this is still good
        link.download = ''
        // Append to document, click and then remove
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    }

    if ('__copy' in payload) {
      // Validate it is a string
      if (typeof payload.__copy !== 'string') {
        throw new Error('Invalid payload: __copy')
      } else {
        // Copy content to clipboard
        navigator.clipboard.writeText(payload.__copy).catch((err) => {
          console.error('Failed to copy text to clipboard:', err)
        })
      }
    }
  }

  return { handleActionPayload }
}
