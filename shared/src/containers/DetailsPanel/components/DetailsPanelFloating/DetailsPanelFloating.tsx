import { FC, useEffect, useMemo, useRef } from 'react'
import { PiPWrapper, useDetailsPanelContext, usePiPWindow } from '@shared/context'
import { buildDetailsPipUrl, DETAILS_PIP_OPEN_VIEWER } from './detailsPip'

export interface DetailsPanelFloatingProps {}

// inline: the PiP window only gets a copy of the stylesheets made when it opens
const frameStyle = { display: 'block', width: '100%', height: '100%', border: 'none' }

// The details panel in a picture-in-picture window (or a floating dialog where the browser has no
// document picture-in-picture): the full panel, loaded as its own page in an iframe.
export const DetailsPanelFloating: FC<DetailsPanelFloatingProps> = () => {
  const { pip, onOpenViewer } = useDetailsPanelContext()
  const { pipWindow } = usePiPWindow()
  const frameRef = useRef<HTMLIFrameElement>(null)

  const entityType = pip?.entityType
  const entities = pip?.entities
  const src = useMemo(
    () => (entityType && entities?.length ? buildDetailsPipUrl({ entityType, entities }) : null),
    [entityType, entities],
  )

  // the viewer opens in the main window, where there is room for it
  useEffect(() => {
    // the frame's parent: the PiP window, or this window for the fallback dialog
    const host = pipWindow || window
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      if (!frameRef.current || event.source !== frameRef.current.contentWindow) return
      if (event.data?.type !== DETAILS_PIP_OPEN_VIEWER) return
      onOpenViewer?.(event.data.args)
      window.focus()
    }
    host.addEventListener('message', handleMessage)
    return () => host.removeEventListener('message', handleMessage)
  }, [pipWindow, onOpenViewer])

  if (!src) return null

  return (
    <PiPWrapper>
      <iframe
        ref={frameRef}
        src={src}
        title="Details panel"
        style={frameStyle}
        data-testid="details-pip-frame"
      />
    </PiPWrapper>
  )
}

export default DetailsPanelFloating
