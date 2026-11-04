// The line above the stage: which contribution is on it and where AYON shows it. Everything under
// it is AYON (its surfaces, or stand-ins for the app's); the caption is the shell's.
import { Icon } from '@ynput/ayon-react-components'
import { contributionTitle, getRegistry } from '@ynput/ayon-addon/host'
import { SLOT_DOCS } from '@ynput/ayon-addon/check'
import type { SlotName } from '@ynput/ayon-addon'
import { slotIcon, slotPath } from './slotGroups'
import type { ShellSelection } from './types'

export const StageCaption = ({
  mode,
  selection,
}: {
  mode: 'live' | 'preview'
  selection: ShellSelection
}) => {
  const contribution = getRegistry().contributions.find(
    (c) => c.slot === selection.slot && (c as { id: string }).id === selection.id,
  )
  if (!contribution) return null
  const slot = contribution.slot
  return (
    <header className="ayon-shell-caption" data-shell-surface="caption">
      <Icon icon={slotIcon(slot) as never} />
      <div className="ayon-shell-caption-text">
        <div>
          <strong>{contributionTitle(contribution)}</strong>
          <span className="ayon-shell-caption-path">
            {slotPath(slot).map((part) => (
              <span key={part}>{part}</span>
            ))}
          </span>
        </div>
        <small>
          {SLOT_DOCS[slot as SlotName]?.where} · <code>{slot}</code>
        </small>
      </div>
      <span className={`ayon-shell-chip ${mode}`}>
        {mode === 'live' ? 'Live' : `Preview: ${selection.preview}`}
      </span>
    </header>
  )
}
