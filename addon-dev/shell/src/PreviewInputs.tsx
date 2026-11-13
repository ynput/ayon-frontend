// Context: the drawer below the stage. What the place is rendered with (a preview scene's
// fields, or the project, the studio's projects, entities, table page and user for AYON's places),
// the context each of its slots passes, and the saved examples (preview fixtures). Its height is
// the stage column's splitter (Shell.tsx); collapsed, only its header shows.
import { useEffect, useState, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import { Button, Dialog, Dropdown, Icon, InputText } from '@ynput/ayon-react-components'
import { EntityPicker, useUser } from '@ynput/ayon-addon'
import type { PickableEntityType } from '@ynput/ayon-addon'
import { contributionTitle } from '@ynput/ayon-addon/host'
import { useGetEntitiesDetailsPanelQuery, useGetUsersQuery, useListProjectsQuery } from '@ynput/ayon-frontend-shared/api'
import { JsonViewer } from '@ynput/ayon-frontend-shared/components'
import { contributionsTo, getPlace, idOf } from './catalog'
import { getUnmatched, onUnmatched } from './network'
import type { PlaceSlot } from './places'
import { SceneForm } from './scenes'
import { ENTITY_TYPES, placeNeeds } from './slotNeeds'
import { fixtureFor, getReports, subscribeReports } from './status'
import type { ShellSelection } from './types'

interface InputsProps {
  selection: ShellSelection
  onChange: (selection: ShellSelection) => void
}

// functions and elements are shown by name, the rest as JSON
const showContext = (context: Record<string, unknown> | undefined) =>
  context
    ? JSON.stringify(
        context,
        (_key, value) =>
          typeof value === 'function'
            ? `ƒ ${value.name || 'function'}`
            : value instanceof Element
            ? `<${value.tagName.toLowerCase()}>`
            : value,
        2,
      )
    : '—'

/** A picker's row: its label, then the control. */
const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="ayon-shell-field">
    <label>{label}</label>
    <div>{children}</div>
  </div>
)

const ProjectPicker = ({ selection, onChange }: InputsProps) => {
  const { data: projects = [] } = useListProjectsQuery({ active: true })
  return (
    <Field label="Project">
      <Dropdown
        value={selection.projectName ? [selection.projectName] : []}
        options={projects.map((p) => ({ value: p.name, label: p.name }))}
        search
        onChange={(added) => onChange({ ...selection, projectName: added[0], entities: [] })}
      />
    </Field>
  )
}

// the studio's project selection: AYON's project list on a studio page shows the same one
const ProjectsPicker = ({ selection, onChange }: InputsProps) => {
  const { data: projects = [] } = useListProjectsQuery({ active: true })
  const value = selection.projectNames ?? (selection.projectName ? [selection.projectName] : [])
  return (
    <Field label="Projects">
      <Dropdown
        value={value}
        options={projects.map((p) => ({ value: p.name, label: p.name }))}
        multiSelect
        search
        placeholder="None selected"
        onChange={(names) => onChange({ ...selection, projectNames: names })}
      />
    </Field>
  )
}

const EntitiesPicker = ({ selection, onChange }: InputsProps) => {
  const [picking, setPicking] = useState(false)
  const entityType = selection.entityType || 'task'
  const { projectName, entities } = selection
  // names for the list (and the contexts: AYON passes them when it has them)
  const { data: details = [] } = useGetEntitiesDetailsPanelQuery(
    { entityType: entityType as never, entities: entities.map((e) => ({ id: e.id, projectName: e.projectName })) },
    { skip: !entities.length || entities.some((e) => e.name) },
  )
  useEffect(() => {
    if (!details.length) return
    const named = entities.map((entity) => {
      const found = (details as { id: string; name?: string; label?: string }[]).find(
        (d) => d.id === entity.id,
      )
      return found ? { ...entity, name: found.name, label: found.label || undefined } : entity
    })
    onChange({ ...selection, entities: named })
    // only when the details arrive
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [details])

  if (!projectName) return null
  return (
    <Field label="Entities">
      <div className="ayon-shell-entities">
        <Dropdown
          value={[entityType]}
          options={ENTITY_TYPES.map((type) => ({ value: type, label: type }))}
          onChange={(added) => onChange({ ...selection, entityType: added[0], entities: [] })}
        />
        <Button
          icon="ads_click"
          label={entities.length ? 'Change' : 'Pick'}
          data-shell-action="pick-entities"
          onClick={() => setPicking(true)}
        />
      </div>
      {entities.map((entity) => (
        <div key={entity.id} className="ayon-shell-entity">
          <span>{entity.label || entity.name || entity.id}</span>
          <Button
            icon="close"
            variant="text"
            aria-label="Remove"
            onClick={() =>
              onChange({ ...selection, entities: entities.filter((e) => e.id !== entity.id) })
            }
          />
        </div>
      ))}
      {picking && (
        // the one addons get, as the shell's host provides it
        <EntityPicker
          projectName={projectName}
          entityType={entityType as PickableEntityType}
          multiSelect
          initialSelection={entities}
          onClose={() => setPicking(false)}
          onSubmit={(picked) => {
            setPicking(false)
            onChange({ ...selection, entityType, entities: picked })
          }}
        />
      )}
    </Field>
  )
}

// the user details panel's user; else the signed-in one, unless it is a service user (an API key)
const UserPicker = ({ selection, onChange }: InputsProps) => {
  const signedIn = useUser()
  const { data: users = [] } = useGetUsersQuery({ selfName: signedIn?.name })
  const list = users as { name: string; isService?: boolean; attrib?: { fullName?: string } }[]
  return (
    <Field label="User">
      <Dropdown
        value={selection.userName ? [selection.userName] : []}
        options={list.map((u) => ({
          value: u.name,
          label: u.isService ? `${u.name} (service)` : u.attrib?.fullName || u.name,
        }))}
        placeholder="Signed-in user"
        search
        onChange={(names) => onChange({ ...selection, userName: names[0] })}
      />
    </Field>
  )
}

const TablePage = ({ selection, onChange }: InputsProps) => (
  <Field label="Table">
    <Dropdown
      value={[selection.page || 'overview']}
      options={['overview', 'products', 'lists'].map((page) => ({ value: page, label: page }))}
      onChange={(added) => onChange({ ...selection, page: added[0] as ShellSelection['page'] })}
    />
  </Field>
)

// the place's inputs: a scene's fields, else the pickers AYON's place needs
const InputValues = ({ mode, selection, onChange }: InputsProps & { mode: 'live' | 'preview' }) => {
  const place = getPlace(selection.surface)
  if (mode === 'preview') return <small className="ayon-shell-note">From the fixture.</small>
  if (place?.scene) return <SceneForm scene={place.scene} selection={selection} onChange={onChange} />
  const needs = placeNeeds(place?.id)
  if (!needs.project && !needs.projects && !needs.entities && !needs.user) {
    return <small className="ayon-shell-note">Nothing to choose for this place.</small>
  }
  return (
    <div className="ayon-shell-fields">
      {needs.project && <ProjectPicker selection={selection} onChange={onChange} />}
      {needs.projects && <ProjectsPicker selection={selection} onChange={onChange} />}
      {needs.entities && <EntitiesPicker selection={selection} onChange={onChange} />}
      {needs.tablePage && <TablePage selection={selection} onChange={onChange} />}
      {needs.user && <UserPicker selection={selection} onChange={onChange} />}
    </div>
  )
}

/** A heading that opens and closes what is under it. */
const Disclosure = ({
  label,
  detail,
  open,
  onToggle,
  extra,
  children,
}: {
  label: string
  /** muted, after the label (a slot's name) */
  detail?: string
  open: boolean
  onToggle: () => void
  extra?: ReactNode
  children: ReactNode
}) => (
  <div className="ayon-shell-disclosure">
    <div className="ayon-shell-subheader">
      <button className="ayon-shell-subheader label" aria-expanded={open} onClick={onToggle}>
        <Icon icon={open ? 'expand_more' : 'chevron_right'} />
        {label}
        {detail && <code>{detail}</code>}
      </button>
      {extra}
    </div>
    {open && children}
  </div>
)

// what one slot of the place passes: a few lines, the whole of it in a dialog
const SlotContext = ({ slot, count, context }: { slot: PlaceSlot; count: number; context?: Record<string, unknown> }) => {
  const [open, setOpen] = useState<boolean>()
  const [dialog, setDialog] = useState(false)
  const text = showContext(context)
  return (
    <div className="ayon-shell-slot-context" data-shell-context-slot={slot.slot}>
      <Disclosure
        label={slot.label}
        detail={slot.slot}
        // open while it has something, until opened or closed by hand
        open={open ?? !!context}
        onToggle={() => setOpen(!(open ?? !!context))}
        extra={
          context && (
            <Button
              icon="open_in_full"
              variant="text"
              data-tooltip="Show the whole context"
              aria-label="Show the whole context"
              onClick={() => setDialog(true)}
            />
          )
        }
      >
        {!context ? (
          <small className="ayon-shell-note">Nothing received yet: it shows once the slot is on screen (a menu: once it opens).</small>
        ) : (
          <>
            <button className="ayon-shell-context" data-shell-context title="Show the whole context" onClick={() => setDialog(true)}>
              <pre className="ayon-shell-code">{text}</pre>
            </button>
            {count > 1 && <small className="ayon-shell-note">Shown in {count} places with different contexts: this is the first.</small>}
          </>
        )}
      </Disclosure>
      {dialog && context && (
        <Dialog isOpen header={`Context received: ${slot.label}`} size="lg" onClose={() => setDialog(false)}>
          <JsonViewer value={JSON.parse(text)} wrap />
        </Dialog>
      )}
    </div>
  )
}

// the context each slot of the place passes its contributions, all at once
const ContextReceived = ({ selection }: { selection: ShellSelection }) => {
  const reports = useSyncExternalStore(subscribeReports, getReports)
  const place = getPlace(selection.surface)
  const [open, setOpen] = useState(true)
  const slots = place?.kind === 'other' ? [] : place?.slots || []
  return (
    <Disclosure label="Context received" open={open} onToggle={() => setOpen(!open)}>
      {!slots.length && <small className="ayon-shell-note">No slot here passes a context in the dev shell.</small>}
      {slots.map((slot) => {
        const list = reports.get(slot.slot) || []
        // the same context from several contributions of one outlet counts once
        const distinct = new Set(list.map((report) => showContext(report.context)))
        return <SlotContext key={slot.slot} slot={slot} count={distinct.size} context={list[0]?.context} />
      })}
    </Disclosure>
  )
}

// save a contribution's context and the server's answers as a preview fixture, and open the saved ones
const SavedExamples = ({ mode, selection }: { mode: 'live' | 'preview'; selection: ShellSelection }) => {
  const [open, setOpen] = useState(mode === 'preview')
  const [names, setNames] = useState<string[]>([])
  const [name, setName] = useState('')
  const [saved, setSaved] = useState<string>()
  const reports = useSyncExternalStore(subscribeReports, getReports)
  const list = () =>
    fetch('/__ayon-addon/fixtures')
      .then((response) => (response.ok ? response.json() : []))
      .then(setNames)
      .catch(() => setNames([]))
  useEffect(() => {
    list()
  }, [])
  // the place's contributions whose slot passed a context
  const place = getPlace(selection.surface)
  const savable = (place?.slots || []).flatMap((s) => (reports.has(s.slot) ? contributionsTo(s.slot) : []))
  const [picked, setPicked] = useState<string>()
  const contribution = savable.find((c) => c.key === picked) ?? savable[0]
  const save = async () => {
    const fixture = contribution && fixtureFor(contribution.slot, idOf(contribution))
    if (!fixture || !name) return
    const response = await fetch(`/__ayon-addon/fixtures/${encodeURIComponent(name)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fixture, null, 2),
    })
    setSaved(response.ok ? `Saved dev/fixtures/${name}.json` : `Failed: ${response.status}`)
    list()
  }
  return (
    <Disclosure label={`Saved examples${names.length ? ` (${names.length})` : ''}`} open={open} onToggle={() => setOpen(!open)}>
      <small className="ayon-shell-note">
        A contribution&apos;s context and the server&apos;s answers (preview fixtures), to render it without a server.
      </small>
      {mode === 'live' && contribution && (
        <div className="ayon-shell-entities">
          <Dropdown
            value={[contribution.key]}
            options={savable.map((c) => ({ value: c.key, label: contributionTitle(c) }))}
            onChange={(keys) => setPicked(keys[0])}
          />
          <InputText
            value={name}
            placeholder={idOf(contribution)}
            onChange={(e) => setName(e.target.value.replace(/[^\w-]/g, ''))}
          />
          <Button icon="save" label="Save" disabled={!name} onClick={save} />
        </div>
      )}
      {saved && <small className="ayon-shell-note">{saved}</small>}
      {names.map((fixture) => (
        <a
          key={fixture}
          className={`ayon-shell-link${fixture === selection.preview ? ' selected' : ''}`}
          href={`?preview=${encodeURIComponent(fixture)}`}
        >
          <Icon icon="description" />
          {fixture}
        </a>
      ))}
      {selection.preview && (
        <a className="ayon-shell-link" href="?">
          <Icon icon="arrow_back" />
          Back to live
        </a>
      )}
    </Disclosure>
  )
}

const NotInFixture = () => {
  const unmatched = useSyncExternalStore(onUnmatched, () => getUnmatched().join('\n'))
  if (!unmatched) return null
  return (
    <div className="ayon-shell-passed">
      <div className="ayon-shell-subheader">
        <span className="label">Not in the fixture</span>
      </div>
      <pre className="ayon-shell-code">{unmatched}</pre>
    </div>
  )
}

export const PreviewInputs = ({
  mode,
  selection,
  onChange,
  open,
  onToggle,
}: InputsProps & { mode: 'live' | 'preview'; open: boolean; onToggle: () => void }) => {
  const [valuesOpen, setValuesOpen] = useState(true)
  return (
    <section className={`ayon-shell-inputs${open ? ' open' : ''}`} data-shell-surface="preview-inputs">
      <div className="ayon-shell-inputs-header">
        <Button
          icon={open ? 'bottom_panel_close' : 'bottom_panel_open'}
          variant="text"
          className="ayon-shell-icon-button"
          aria-expanded={open}
          aria-label={open ? 'Hide Context (/)' : 'Show Context (/)'}
          data-tooltip={open ? 'Hide context /' : 'Show context /'}
          data-shell-action="toggle-inputs"
          onClick={onToggle}
        />
        <span>Context</span>
      </div>
      {open && (
        <div className="ayon-shell-inputs-body">
          <div className="ayon-shell-inputs-column">
            <Disclosure label="Input values" open={valuesOpen} onToggle={() => setValuesOpen(!valuesOpen)}>
              <InputValues mode={mode} selection={selection} onChange={onChange} />
            </Disclosure>
          </div>
          <div className="ayon-shell-inputs-column">
            <ContextReceived selection={selection} />
            {mode === 'preview' && <NotInFixture />}
            <SavedExamples mode={mode} selection={selection} />
          </div>
        </div>
      )}
    </section>
  )
}
