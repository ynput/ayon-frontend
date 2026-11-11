// The line above the stage: which contribution is on it and where AYON shows it. Everything under
// it is AYON (its surfaces, or stand-ins for the app's); the caption is the shell's.
import { Icon, InputSwitch } from '@ynput/ayon-react-components'
import { contributionTitle, getRegistry } from '@ynput/ayon-addon/host'
import { SLOT_DOCS } from '@ynput/ayon-addon/check'
import type { SlotName } from '@ynput/ayon-addon'
import { contractSlot, getContracts, sceneFor } from './contractModel'
import { slotIcon, slotPath } from './slotGroups'
import type { ShellSelection } from './types'

// outlines and placeholders of the slots rendered with the SDK (slotOverlay.tsx), in the URL
const ShowSlots = ({ selection, onChange }: { selection: ShellSelection; onChange: (s: ShellSelection) => void }) => (
  <label
    className="ayon-shell-toggle"
    data-shell-action="show-slots"
    title="Outline the slots on the stage, with a placeholder where a slot has no contributions"
  >
    <InputSwitch
      checked={selection.showSlots !== false}
      onChange={(e) => onChange({ ...selection, showSlots: (e.target as HTMLInputElement).checked })}
    />
    Show slots
  </label>
)

export const StageCaption = ({
  mode,
  addon,
  selection,
  onChange,
}: {
  mode: 'live' | 'preview'
  /** the addon's name: its own slots get the Show slots toggle too */
  addon: string
  selection: ShellSelection
  onChange: (selection: ShellSelection) => void
}) => {
  const contribution = getRegistry().contributions.find(
    (c) => c.slot === selection.slot && (c as { id: string }).id === selection.id,
  )
  const chip = (
    <span className={`ayon-shell-chip ${mode}`}>
      {mode === 'live' ? 'Live' : `Preview: ${selection.preview}`}
    </span>
  )
  // another addon's UI, mocked by its contract package, with its slots
  const scene = mode === 'live' ? sceneFor(selection) : undefined
  // where SlotOutlets are: a scene, or the addon's own UI when it declares slots
  const outlets = !!scene || getRegistry().slots.some((slot) => slot.owner.name === addon)
  const toggle = outlets ? <ShowSlots selection={selection} onChange={onChange} /> : null
  if (scene) {
    const area = getContracts().find((c) => c.package === scene.package)
    return (
      <header className="ayon-shell-caption" data-shell-surface="caption">
        <Icon icon="preview" />
        <div className="ayon-shell-caption-text">
          <div>
            <strong>{scene.label}</strong>
            <span className="ayon-shell-caption-path">
              <span>{area?.addons.join(', ') || scene.package}</span>
              <span>Preview scene from {scene.package}</span>
            </span>
          </div>
          <small>
            {scene.description ? `${scene.description} · ` : ''}
            {scene.slots.map((slot, index) => (
              <span key={slot}>
                {index > 0 && ', '}
                <code>{slot}</code>
              </span>
            ))}
          </small>
        </div>
        {toggle}
        {chip}
      </header>
    )
  }
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
          {SLOT_DOCS[slot as SlotName]?.where || contractSlot(slot)?.description} · <code>{slot}</code>
        </small>
      </div>
      {toggle}
      {chip}
    </header>
  )
}
