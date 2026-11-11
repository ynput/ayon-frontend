// The lines above the stage: the place on it, how many of its slots this addon uses, and the
// focus (a slot, or one of its contributions) with how to see it when it isn't on screen yet.
// Everything under it is AYON (its surfaces, or stand-ins for the app's); the header is the shell's.
import { Button, Icon } from '@ynput/ayon-react-components'
import { contributionTitle } from '@ynput/ayon-addon/host'
import { contributionsTo, findContribution, getPlace, getUsedSlots, slotDeclaration } from './catalog'
import { placeSummary } from './places'
import type { Place } from './places'
import { useSlotOverlay } from './slotOverlay'
import type { ShellSelection } from './types'

// AYON's slots whose contributions aren't on screen until the developer opens something
const INSTRUCTIONS: Record<string, string> = {
  entityMenuItem: 'Right-click a row to see this menu.',
  'projectTable.columnMenuItem':
    'The stand-in table has no column menus: pick a column in the toolbar and use Run in Preview inputs.',
  'table.shortcut': 'Click a row, then press the shortcut.',
  'detailsPanel.menuItem': "Open the details panel's more menu to see this item.",
  'slicer.menuItem': 'Right-click a row in the slicer, or open its menu, to see this item.',
  'projectList.menuItem': 'Right-click a project to see this menu.',
  'userDetails.menuItem': "The stand-in shows the more menu's items as buttons in its bar.",
}

/** How to see the focused slot on stage, when it needs more than looking. */
const instruction = (place: Place, slot: string | undefined, focus: unknown, mounted: readonly string[]) => {
  if (!slot) return undefined
  if (place.kind === 'ayon') {
    const keys = (focus as { keys?: string } | undefined)?.keys
    if (slot === 'table.shortcut' && keys) return `Click a row, then press ${keys}.`
    return INSTRUCTIONS[slot]
  }
  if (place.kind !== 'scene') return undefined
  const pieces = (slotDeclaration(slot) as { pieces?: readonly string[] } | undefined)?.pieces || []
  if (pieces.includes('run')) return 'Right-click in the preview to see this menu.'
  if (!mounted.includes(slot)) return 'Not on screen yet: open the part of the preview that shows it.'
  return undefined
}

export const StageHeader = ({
  mode,
  selection,
  onChange,
}: {
  mode: 'live' | 'preview'
  selection: ShellSelection
  onChange: (selection: ShellSelection) => void
}) => {
  const overlay = useSlotOverlay()
  const place = getPlace(selection.surface)
  const chip = (
    <span className={`ayon-shell-chip ${mode}`}>
      {mode === 'live' ? 'Live data' : `Preview: ${selection.preview}`}
    </span>
  )
  if (!place) {
    return (
      <header className="ayon-shell-caption" data-shell-surface="caption">
        <div className="ayon-shell-caption-text" />
        {chip}
      </header>
    )
  }
  const used = getUsedSlots()
  const focus = findContribution(selection.slot, selection.id)
  const slot = selection.slot ? place.slots.find((s) => s.slot === selection.slot) : undefined
  const unused = !!selection.slot && !used.has(selection.slot)
  const help =
    focus && overlay.emptyFocus === focus.key
      ? 'Not shown with these inputs.'
      : instruction(place, selection.slot, focus, overlay.mounted)
  return (
    <header className="ayon-shell-caption" data-shell-surface="caption">
      <Icon icon={place.icon as never} />
      <div className="ayon-shell-caption-text">
        <div>
          <strong>{place.label}</strong>
          {place.kind === 'scene' && (
            <span className="ayon-shell-caption-path" title={place.scene?.description}>
              <span>Preview scene from {place.source}</span>
            </span>
          )}
          {place.simplified && (
            <span className="ayon-shell-chip" title="Some surrounding AYON controls are omitted.">
              Simplified preview
            </span>
          )}
        </div>
        <small>
          {place.kind === 'other' ? 'No preview' : `${placeSummary(place, used, contributionsTo('app.service').length).replace(/ used$/, ' slots used')}`}
          {slot && (
            <>
              {' · Focus: '}
              <strong>{slot.label}</strong>
              {focus && ` › ${contributionTitle(focus)}`} <code>{slot.slot}</code>
              {unused && <span className="ayon-shell-chip">Unused</span>}
            </>
          )}
          {!slot && place.scene?.description && ` · ${place.scene.description}`}
        </small>
        {help && (
          <small className="ayon-shell-instruction" data-shell-instruction>
            <Icon icon="info" /> {help}
          </small>
        )}
      </div>
      {slot && (
        <Button
          label="Clear focus"
          variant="text"
          data-shell-action="clear-focus"
          onClick={() => onChange({ ...selection, slot: undefined, id: undefined })}
        />
      )}
      {chip}
    </header>
  )
}
