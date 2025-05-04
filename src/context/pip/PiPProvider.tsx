import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { uuid } from 'short-uuid'

type PiPContextType = {
  isSupported: boolean
  pipWindow: Window | null
  pipId: string | null
  requestPipWindow: (width: number, height: number) => Promise<void>
  closePipWindow: () => void
}

const PiPContext = createContext<PiPContextType | undefined>(undefined)

type PiPProviderProps = {
  children: React.ReactNode
}

export function PiPProvider({ children }: PiPProviderProps) {
  const isUsingSecureProtocol =
    window.location.protocol === 'https:' || window.location.hostname === 'localhost'
  // Detect if the feature is available and the protocol is secure
  const isSupported = 'documentPictureInPicture' in window && isUsingSecureProtocol

  // Expose pipWindow that is currently active
  const [pipWindow, setPipWindow] = useState<Window | null>(null)
  // each time pip is opened, we generated a unique id for it
  const [pipId, setPipId] = useState<string | null>(null)

  // Close pip window programmatically
  const closePipWindow = useCallback(() => {
    setPipId(null)
    if (pipWindow != null) {
      pipWindow.close()
      setPipWindow(null)
    }
  }, [pipWindow, pipId])

  // Open new pipWindow
  const requestPipWindow = useCallback(
    async (width: number, height: number) => {
      // check pip is supported
      if (!isSupported) {
        // open but not with window
        setPipId(uuid())
        return
      }

      // We don't want to allow multiple requests.
      if (pipWindow != null) {
        console.log('pipWindow is already open')
        // update the pipId to trigger re-render
        setPipId(uuid())
        return
      }

      const pip = await window.documentPictureInPicture.requestWindow({
        width,
        height,
      })

      // Detect when window is closed by user
      pip.addEventListener('pagehide', () => {
        setPipWindow(null)
        setPipId(null)
      })

      setPipWindow(pip)
      setPipId(uuid())
    },
    [pipWindow, pipId],
  )

  useEffect(() => {
    // It is important to copy all parent window styles. Otherwise, there would be no CSS available at all
    // https://developer.chrome.com/docs/web-platform/document-picture-in-picture/#copy-style-sheets-to-the-picture-in-picture-window
    ;[...document.styleSheets].forEach((styleSheet) => {
      try {
        const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('')
        const style = document.createElement('style')

        style.textContent = cssRules
        pipWindow?.document.head.appendChild(style)

        // add height 100% to html and body
        const rootStyles = document.createElement('style')
        rootStyles.textContent = `
          html, body, .pipRoot {
            height: 100%;
            margin: 0;
            padding: 0;
            overflow: hidden;
      }`
        pipWindow?.document.head.appendChild(rootStyles)
      } catch (e) {
        const link = document.createElement('link')
        if (styleSheet.href == null) {
          return
        }

        link.rel = 'stylesheet'
        link.type = styleSheet.type
        link.media = styleSheet.media.toString()
        link.href = styleSheet.href
        pipWindow?.document.head.appendChild(link)
      }
    })
  }, [pipWindow])

  const value = useMemo(() => {
    {
      return {
        isSupported,
        pipWindow,
        pipId,
        requestPipWindow,
        closePipWindow,
      }
    }
  }, [closePipWindow, isSupported, pipWindow, requestPipWindow])

  return <PiPContext.Provider value={value}>{children}</PiPContext.Provider>
}

export function usePiPWindow(): PiPContextType {
  const context = useContext(PiPContext)

  if (context === undefined) {
    throw new Error('usePiPWindow must be used within a PiPContext')
  }

  return context
}
