// The line above the stage: the place on it, with where it comes from behind (i), and a warning
// when the stage isn't showing a server's live data. One fixed height: nothing in it changes the
// stage's size. Everything under it is AYON (its surfaces, or stand-ins for the app's); the
// header is the shell's, except the slot menu on the right, which is AYON's header menu.
import { useEffect, useRef, useState } from 'react'
import { Button, Icon } from '@ynput/ayon-react-components'
import { SlotInspectorMenu } from '@ynput/ayon-frontend-shared/components'
import { getPlace } from './catalog'
import type { ShellSelection } from './types'

/** The (i) next to the place: what it is, in a popover over the stage. */
const About = ({ lines }: { lines: string[] }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return undefined
    const close = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('pointerdown', close)
    return () => window.removeEventListener('pointerdown', close)
  }, [open])
  return (
    <div className="ayon-shell-caption-about-anchor" ref={ref}>
      <button
        className="ayon-shell-caption-info"
        aria-label="About this place"
        aria-expanded={open}
        data-shell-action="place-info"
        onClick={() => setOpen(!open)}
      >
        <Icon icon="info" />
      </button>
      {open && (
        <div className="ayon-shell-caption-about" data-shell-about role="dialog">
          {lines.map((line) => (
            <small key={line}>{line}</small>
          ))}
        </div>
      )}
    </div>
  )
}

export const StageHeader = ({
  mode,
  selection,
  panelOpen,
  onTogglePanel,
}: {
  mode: 'live' | 'preview'
  selection: ShellSelection
  /** the developer panel on the left */
  panelOpen: boolean
  onTogglePanel: () => void
}) => {
  const place = getPlace(selection.surface)
  // where the place comes from and what it is: behind (i)
  const about = place
    ? ([
        place.kind === 'scene' ? `Preview scene from ${place.source}` : undefined,
        place.scene?.description,
        place.kind === 'other' ? 'Slots without a preview in the dev shell.' : undefined,
        place.simplified ? 'Simplified preview: some surrounding AYON controls are omitted.' : undefined,
      ].filter(Boolean) as string[])
    : []
  return (
    <header className="ayon-shell-caption" data-shell-surface="caption">
      <Button
        icon={panelOpen ? 'left_panel_close' : 'left_panel_open'}
        variant="text"
        className="ayon-shell-icon-button"
        aria-label={panelOpen ? 'Hide the developer panel (,)' : 'Show the developer panel (,)'}
        data-tooltip={panelOpen ? 'Hide panel ,' : 'Show panel ,'}
        data-shell-action="toggle-panel"
        onClick={onTogglePanel}
      />
      {place && <Icon icon={place.icon as never} />}
      <strong className="ayon-shell-caption-title">{place?.label}</strong>
      {about.length > 0 && <About key={place?.id} lines={about} />}
      <span className="spacer" />
      {mode === 'preview' && (
        <span
          className="ayon-shell-chip warning"
          title="The stage answers from a saved example: no server, no live data."
          data-shell-status="preview"
        >
          <Icon icon="cloud_off" />
          Preview: {selection.preview}, not live
        </span>
      )}
      {/* developer mode's slot menu from AYON's header */}
      <SlotInspectorMenu />
    </header>
  )
}
