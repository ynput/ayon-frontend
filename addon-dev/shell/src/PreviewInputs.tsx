// Preview inputs: the drawer below the stage. What the place is rendered with (a preview scene's
// fields, or the project, the studio's projects, entities and table page for AYON's places), the
// context the focused contribution received, and the saved examples (preview fixtures). The
// inputs are the place's, not the focused contribution's: they stay when the focus changes.
import { useEffect, useState, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import { Button, Dialog, Dropdown, Icon, InputText } from '@ynput/ayon-react-components'
import { EntityPicker } from '@ynput/ayon-addon'
import type { PickableEntityType } from '@ynput/ayon-addon'
import { useGetEntitiesDetailsPanelQuery, useListProjectsQuery } from '@ynput/ayon-frontend-shared/api'
import { JsonViewer } from '@ynput/ayon-frontend-shared/components'
import { findContribution, getPlace } from './catalog'
import { getUnmatched, onUnmatched } from './network'
import { SceneForm } from './scenes'
import { ENTITY_TYPES, isMenuSlot, placeNeeds } from './slotNeeds'
import { getStageContext, subscribeStage } from './status'
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
  if (!needs.project && !needs.projects && !needs.entities) {
    return <small className="ayon-shell-note">Nothing to choose for this place.</small>
  }
  return (
    <div className="ayon-shell-fields">
      {needs.project && <ProjectPicker selection={selection} onChange={onChange} />}
      {needs.projects && <ProjectsPicker selection={selection} onChange={onChange} />}
      {needs.entities && <EntitiesPicker selection={selection} onChange={onChange} />}
      {needs.tablePage && <TablePage selection={selection} onChange={onChange} />}
    </div>
  )
}

/** A heading that opens and closes what is under it. */
const Disclosure = ({
  label,
  open,
  onToggle,
  extra,
  children,
}: {
  label: string
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
      </button>
      {extra}
    </div>
    {open && children}
  </div>
)

// the context the focused contribution got: a few lines, the whole of it in a dialog
const ContextReceived = ({ selection }: { selection: ShellSelection }) => {
  const context = useSyncExternalStore(subscribeStage, getStageContext)
  const [open, setOpen] = useState(true)
  const [dialog, setDialog] = useState(false)
  const focus = findContribution(selection.slot, selection.id)
  const text = showContext(context)
  return (
    <Disclosure
      label="Context received"
      open={open}
      onToggle={() => setOpen(!open)}
      extra={
        <Button
          icon="open_in_full"
          variant="text"
          data-tooltip="Show the whole context"
          aria-label="Show the whole context"
          disabled={!context}
          onClick={() => setDialog(true)}
        />
      }
    >
      {!focus ? (
        <small className="ayon-shell-note">Select a contribution to inspect the context it receives.</small>
      ) : !context ? (
        <small className="ayon-shell-note">Nothing received yet: it shows once the contribution is on screen (a menu: once it opens).</small>
      ) : (
        <button
          className="ayon-shell-context"
          data-shell-context
          title="Show the whole context"
          onClick={() => setDialog(true)}
        >
          <pre className="ayon-shell-code">{text}</pre>
        </button>
      )}
      {dialog && context && (
        <Dialog isOpen header="Context received" size="lg" onClose={() => setDialog(false)}>
          <JsonViewer value={JSON.parse(text)} wrap />
        </Dialog>
      )}
    </Disclosure>
  )
}

// save the live context and responses as a preview fixture, and open the saved ones
const SavedExamples = ({ mode, selection }: { mode: 'live' | 'preview'; selection: ShellSelection }) => {
  const [open, setOpen] = useState(mode === 'preview')
  const [names, setNames] = useState<string[]>([])
  const [name, setName] = useState('')
  const [saved, setSaved] = useState<string>()
  const list = () =>
    fetch('/__ayon-addon/fixtures')
      .then((response) => (response.ok ? response.json() : []))
      .then(setNames)
      .catch(() => setNames([]))
  useEffect(() => {
    list()
  }, [])
  const save = async () => {
    const fixture = window.__AYON_ADDON_SHELL__?.fixture()
    if (!fixture || !name) return
    const response = await fetch(`/__ayon-addon/fixtures/${encodeURIComponent(name)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fixture, null, 2),
    })
    setSaved(response.ok ? `Saved dev/fixtures/${name}.json` : `Failed: ${response.status}`)
    list()
  }
  const focus = findContribution(selection.slot, selection.id)
  return (
    <Disclosure label={`Saved examples${names.length ? ` (${names.length})` : ''}`} open={open} onToggle={() => setOpen(!open)}>
      <small className="ayon-shell-note">
        A contribution&apos;s context and the server&apos;s answers (preview fixtures), to render it without a server.
      </small>
      {mode === 'live' && focus && (
        <div className="ayon-shell-entities">
          <InputText
            value={name}
            placeholder={`${selection.id}`}
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
  const focus = findContribution(selection.slot, selection.id)
  const [valuesOpen, setValuesOpen] = useState(true)
  return (
    <section className={`ayon-shell-inputs${open ? ' open' : ''}`} data-shell-surface="preview-inputs">
      <button className="ayon-shell-inputs-header" aria-expanded={open} onClick={onToggle}>
        <Icon icon={open ? 'expand_more' : 'chevron_right'} />
        <span>Preview inputs</span>
      </button>
      {open && (
        <div className="ayon-shell-inputs-body">
          <div className="ayon-shell-inputs-column">
            <Disclosure label="Input values" open={valuesOpen} onToggle={() => setValuesOpen(!valuesOpen)}>
              <InputValues mode={mode} selection={selection} onChange={onChange} />
            </Disclosure>
            {focus && isMenuSlot(focus.slot) && (
              <div>
                <Button
                  icon="play_arrow"
                  label={focus.slot === 'table.shortcut' ? 'Press the shortcut' : 'Run the menu item'}
                  variant="filled"
                  data-shell-action="run"
                  onClick={() => window.__AYON_ADDON_SHELL__?.run()}
                />
              </div>
            )}
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
