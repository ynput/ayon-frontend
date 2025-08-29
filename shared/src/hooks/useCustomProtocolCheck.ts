import { useCallback } from 'react'
import customProtocolCheck from 'custom-protocol-check'
import { toast } from 'react-toastify'

interface UseCustomProtocolCheckOptions {
  timeout?: number
  showSuccessMessage?: boolean
  showErrorMessage?: boolean
  enableFallback?: boolean
}

export const useCustomProtocolCheck = (options: UseCustomProtocolCheckOptions = {}) => {
  const {
    timeout = 2000,
    showSuccessMessage = false,
    showErrorMessage = true,
    enableFallback = true,
  } = options

  const checkProtocol = useCallback((uri: string): Promise<boolean> => {
    return new Promise((resolve) => {
      let hasResolved = false
      
      const resolveOnce = (result: boolean) => {
        if (hasResolved) return
        hasResolved = true
        resolve(result)
      }

      const timeoutId = setTimeout(() => {
        resolveOnce(false)
      }, timeout + 500) // Add a small buffer to the timeout

      try {
        customProtocolCheck(
          uri,
          () => {
            clearTimeout(timeoutId)
            
            // On success: show nothing
            
            resolveOnce(true)
          },
          () => {
            clearTimeout(timeoutId)
            if (showErrorMessage) {
              toast.error(
                'AYON client is not running. Please start the AYON client application and try again.',
                { 
                  autoClose: 8000,
                  toastId: 'ayon-client-not-running'
                }
              )
            }
            resolveOnce(false)
          },
          timeout
        )
      } catch (error) {
        clearTimeout(timeoutId)
        if (showErrorMessage) {
          toast.error('Failed to launch AYON client action')
        }
        resolveOnce(false)
      }
    })
  }, [timeout, showSuccessMessage, showErrorMessage, enableFallback])

  return { checkProtocol }
}
