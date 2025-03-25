import { useEffect } from 'react'

const useAddonContextResend = (onMessageReceivedHandler: Function) => {

  const handlePostMessage = (event: MessageEvent) => {
    if (event.data?.action === 'request_context') {
      onMessageReceivedHandler()
    }
  }

  useEffect(() => {
    window.addEventListener('message', handlePostMessage, false)
    return () => {
      window.removeEventListener('message', handlePostMessage, false)
    }
  }, [])
}

export default useAddonContextResend
