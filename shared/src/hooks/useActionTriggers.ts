import { useDispatch } from 'react-redux'
import customProtocolCheck from 'custom-protocol-check'
import { api } from '@shared/api'


export type ActionTriggersProps = {
  searchParams: URLSearchParams
  onSetSearchParams: (params: URLSearchParams) => void
  onNavigate: (uri: string) => void
}

interface QueryParams {
  [key: string]: string
}

interface ActionPayload {
  query?: QueryParams // adds query params to the URL
  uri?: string // navigates to a different page
  new_tab?: boolean // opens a new tab
  extra_download?: string // triggers a file download from a URL
  extra_clipboard?: string // copies string content to clipboard
  extra_reload?: string[] // list of tags to invalidate
  [key: string]: any
}

export const useActionTriggers = ({
  searchParams,
  onSetSearchParams,
  onNavigate,
}: ActionTriggersProps) => {
  const dispatch = useDispatch()
  const handleActionPayload = (actionType: string, payload: ActionPayload | null): void => {
    if (!payload) return

    if (actionType === 'launcher') {
      if (payload?.uri) {
        customProtocolCheck(
          payload.uri,
          () => {},
          () => {},
          2000,
        )
      }
    } else if (actionType === 'query') {
      // Validate it is an object of key:value pairs with value being string
      const isValid = Object.values(payload.query as QueryParams).every((value) => {
        return typeof value === 'string'
      })

      if (!isValid) {
        throw new Error('Invalid payload: query')
      } else {
        // Add query params to URL
        for (const [key, value] of Object.entries(payload.query as QueryParams)) {
          searchParams.set(key, value)
        }
        onSetSearchParams(searchParams)
      }
    } else if (actionType === 'navigate') {
      // Validate it is a string
      if (typeof payload.uri !== 'string') {
        throw new Error('Invalid payload: navigate')
      } else {
        // Navigate to the specified page
        onNavigate(payload.uri)
      }
    } else if (actionType === 'redirect') {
      // Validate it is a string
      if (typeof payload.uri !== 'string') {
        throw new Error('Invalid payload: redirect')
      } else {
        const newTab = payload?.new_tab || false
        window.open(payload.uri, newTab ? '_blank' : '_self')
      }
    }

    //
    // Sub-actions
    //

    if ('extra_download' in payload) {
      // Validate it is a string
      if (typeof payload.extra_download !== 'string') {
        throw new Error('Invalid payload: extra_download')
      } else {
        // Trigger file download from the URL
        const downloadUrl = new URL(payload.extra_download, window.location.origin).href
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

    if ('extra_clipboard' in payload) {
      // Validate it is a string
      if (typeof payload.extra_clipboard !== 'string') {
        throw new Error('Invalid payload: extra_clipboard')
      } else {
        // Copy content to clipboard
        navigator.clipboard.writeText(payload.extra_clipboard).catch((err) => {
          console.error('Failed to copy text to clipboard:', err)
        })
      }
    }

    if ('extra_reload' in payload) {
      if (!Array.isArray(payload.extra_reload)) {
        throw new Error('Invalid payload: extra_reload')
      }

      if (payload.extra_reload.length) {
        dispatch(api.util.invalidateTags(payload.extra_reload))
      }
    }

  }

  return { handleActionPayload }
}