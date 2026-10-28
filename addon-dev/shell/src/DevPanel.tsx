// The developer panel: the addon's contributions by where AYON shows them (top), and the context
// the shell gives the one on stage (bottom), each half in its own scroll. The pickers are always
// in the same order and place; what is on stage is said above the stage (StageCaption).
// Everything here is also settable from the URL (params.ts), for `ayon-addon open`.
import { useEffect, useState, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import { Splitter, SplitterPanel } from 'primereact/splitter'
import { Button, Dialog, Dropdown, Icon, InputText } from '@ynput/ayon-react-components'
import { contributionTitle, getRegistry } from '@ynput/ayon-addon/host'
import { SLOT_DOCS } from '@ynput/ayon-addon/check'
import type { AnyContribution, EntityRef, SlotName } from '@ynput/ayon-addon'
import {
  useGetCurrentUserQuery,
  useGetEntitiesDetailsPanelQuery,
  useListProjectsQuery,
} from '@ynput/ayon-frontend-shared/api'
import { JsonViewer } from '@ynput/ayon-frontend-shared/components'
import { EntityPickerDialog } from '@ynput/ayon-frontend-shared/EntityPickerDialog'
import {
  ProjectContextProvider,
  ProjectFoldersContextProvider,
} from '@ynput/ayon-frontend-shared/context'
import { clearAccessToken } from '@ynput/ayon-frontend-shared/util'
import { getUnmatched, onUnmatched } from './network'
import { SLOT_AREAS } from './slotGroups'
import {
  ENTITY_TYPES,
  isMenuSlot,
  needsEntities,
  needsProject,
  needsProjects,
  needsTablePage,
} from './slotNeeds'
import { getStageContext, subscribeStage } from './status'
import type { ShellOptions, ShellSelection } from './types'

interface DevPanelProps {
  options: ShellOptions
  mode: 'live' | 'preview'
  selection: ShellSelection
  onChange: (selection: ShellSelection) => void
}

const idOf = (contribution: AnyContribution) => (contribution as { id: string }).id

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

const Contribution = ({
  contribution,
  selected,
  onClick,
}: {
  contribution: AnyContribution
  selected: boolean
  onClick: () => void
}) => {
  const { icon } = contribution as { icon?: string }
  const id = idOf(contribution)
  return (
    <button
      className={`contribution${selected ? ' selected' : ''}`}
      data-contribution={`${contribution.slot}:${id}`}
      title={id}
      onClick={onClick}
    >
      <Icon icon={(icon || 'extension') as never} />
      <span>{contributionTitle(contribution)}</span>
    </button>
  )
}

// by area of AYON, then by its part and slot; an area's single slot needs no label of its own
const Contributions = ({ selection, onChange }: Pick<DevPanelProps, 'selection' | 'onChange'>) => {
  const { contributions, skipped } = getRegistry()
  const [collapsed, setCollapsed] = useState<string[]>([])
  const known = SLOT_AREAS.flatMap((area) => area.sections.flatMap((s) => s.slots.map((x) => x.slot as string)))
  const other = [...new Set(contributions.map((c) => c.slot))].filter((slot) => !known.includes(slot))
  const areas = other.length
    ? [
        ...SLOT_AREAS,
        {
          label: 'Other',
          icon: 'extension',
          sections: [{ label: undefined, slots: other.map((slot) => ({ slot, label: slot })) }],
        },
      ]
    : SLOT_AREAS

  return (
    <>
      {areas.map((area) => {
        const slots = area.sections.flatMap((section) =>
          section.slots
            .map(({ slot, label }) => ({
              slot,
              label,
              section: section.label,
              items: contributions.filter((c) => c.slot === slot),
            }))
            .filter(({ items }) => items.length),
        )
        if (!slots.length) return null
        const isCollapsed = collapsed.includes(area.label)
        const count = slots.reduce((sum, { items }) => sum + items.length, 0)
        const slotCount = area.sections.reduce((sum, section) => sum + section.slots.length, 0)
        return (
          <section key={area.label} className="ayon-shell-area">
            <button
              className="ayon-shell-area-header"
              aria-expanded={!isCollapsed}
              onClick={() =>
                setCollapsed(
                  isCollapsed ? collapsed.filter((g) => g !== area.label) : [...collapsed, area.label],
                )
              }
            >
              <Icon icon={area.icon as never} />
              <span>{area.label}</span>
              <small>{count}</small>
              <Icon icon={isCollapsed ? 'expand_more' : 'expand_less'} className="toggle" />
            </button>
            {!isCollapsed &&
              slots.map(({ slot, label, section, items }) => (
                <div key={slot} className="ayon-shell-slot">
                  {slotCount > 1 && (
                    <div
                      className="ayon-shell-slot-label"
                      title={`${slot}: ${SLOT_DOCS[slot as SlotName]?.where || ''}`}
                    >
                      {section && <span>{section}</span>}
                      {label}
                    </div>
                  )}
                  {items.map((c) => (
                    <Contribution
                      key={c.key}
                      contribution={c}
                      selected={selection.slot === slot && selection.id === idOf(c)}
                      onClick={() => onChange({ ...selection, slot: slot as SlotName, id: idOf(c) })}
                    />
                  ))}
                </div>
              ))}
          </section>
        )
      })}
      {skipped.length > 0 && (
        <section className="ayon-shell-area">
          <div className="ayon-shell-slot-label">Skipped</div>
          {skipped.map((s) => (
            <div key={`${s.slot}:${s.id}`} className="ayon-addon-error" role="alert">
              {s.slot} {s.id}: {s.reason}
            </div>
          ))}
        </section>
      )}
    </>
  )
}

/** A picker's row: its label, then the control. */
const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="ayon-shell-field">
    <label>{label}</label>
    <div>{children}</div>
  </div>
)

const ProjectPicker = ({ selection, onChange }: Pick<DevPanelProps, 'selection' | 'onChange'>) => {
  const { data: projects = [] } = useListProjectsQuery({ active: true })
  // a project to start with
  useEffect(() => {
    if (!selection.projectName && projects.length) {
      onChange({ ...selection, projectName: projects[0].name, entities: [] })
    }
  }, [projects, selection, onChange])

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
const ProjectsPicker = ({ selection, onChange }: Pick<DevPanelProps, 'selection' | 'onChange'>) => {
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

const EntitiesPicker = ({ selection, onChange }: Pick<DevPanelProps, 'selection' | 'onChange'>) => {
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
        // the picker reads the project's folders, like on a project page
        <ProjectContextProvider projectName={projectName}>
          <ProjectFoldersContextProvider projectName={projectName}>
            <EntityPickerDialog
              projectName={projectName}
              entityType={entityType as never}
              isMultiSelect
              onClose={() => setPicking(false)}
              onSubmit={(ids) => {
                setPicking(false)
                const picked: EntityRef[] = ids.map((id) => ({ id, entityType, projectName }))
                onChange({ ...selection, entityType, entities: picked })
              }}
            />
          </ProjectFoldersContextProvider>
        </ProjectContextProvider>
      )}
    </Field>
  )
}

const TablePage = ({ selection, onChange }: Pick<DevPanelProps, 'selection' | 'onChange'>) => (
  <Field label="Table">
    <Dropdown
      value={[selection.page || 'overview']}
      options={['overview', 'products', 'lists'].map((page) => ({ value: page, label: page }))}
      onChange={(added) => onChange({ ...selection, page: added[0] as ShellSelection['page'] })}
    />
  </Field>
)

// save the live context and responses as a preview fixture, and open the saved ones
const Fixtures = ({ mode, selection }: Pick<DevPanelProps, 'mode' | 'selection'>) => {
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
  return (
    <div className="ayon-shell-fixtures">
      <button className="ayon-shell-subheader" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="label">Preview fixtures</span>
        <small>{names.length || ''}</small>
        <Icon icon={open ? 'expand_less' : 'expand_more'} />
      </button>
      {open && (
        <>
          <small className="ayon-shell-note">
            The context and server answers of a contribution, to render it without a server.
          </small>
          {mode === 'live' && selection.slot && selection.id && (
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
        </>
      )}
    </div>
  )
}

const LiveStatus = ({ options }: { options: ShellOptions }) => {
  const { data: user } = useGetCurrentUserQuery()
  return (
    <small title={`${user?.name} at ${options.serverUrl}`}>
      {user?.name} @ {options.serverUrl.replace(/^https?:\/\//, '')}
      {options.signedInWithKey ? ' · API key' : ''}
      {!options.signedInWithKey && (
        <>
          {' · '}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              clearAccessToken()
              window.location.reload()
            }}
          >
            sign out
          </a>
        </>
      )}
    </small>
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

// the context passed to the contribution: a few lines, the whole of it in a dialog
const ContextPreview = () => {
  const context = useSyncExternalStore(subscribeStage, getStageContext)
  const [open, setOpen] = useState(false)
  const text = showContext(context)
  return (
    <div className="ayon-shell-passed">
      <div className="ayon-shell-subheader">
        <span className="label">Passed to the contribution</span>
        <Button
          icon="open_in_full"
          variant="text"
          data-tooltip="Show the whole context"
          aria-label="Show the whole context"
          disabled={!context}
          onClick={() => setOpen(true)}
        />
      </div>
      <button
        className="ayon-shell-context"
        data-shell-context
        title="Show the whole context"
        disabled={!context}
        onClick={() => setOpen(true)}
      >
        <pre className="ayon-shell-code">{text}</pre>
      </button>
      {open && context && (
        <Dialog isOpen header="Context" size="lg" onClose={() => setOpen(false)}>
          <JsonViewer value={JSON.parse(text)} wrap />
        </Dialog>
      )}
    </div>
  )
}

// the context the shell gives the contribution on stage: what it is picked from, in a fixed order
const ContextPanel = ({ mode, selection, onChange }: Omit<DevPanelProps, 'options'>) => {
  const contribution = getRegistry().contributions.find(
    (c) => c.slot === selection.slot && idOf(c) === selection.id,
  )
  const slot = contribution?.slot
  const live = mode === 'live'
  const pickers = live && !!slot && (needsProject(slot) || needsProjects(slot) || needsEntities(slot))
  return (
    <>
      <h3>Context</h3>
      {!contribution ? (
        <small className="ayon-shell-note">Pick a contribution.</small>
      ) : (
        <>
          {pickers ? (
            <div className="ayon-shell-fields">
              {needsProject(slot) && <ProjectPicker selection={selection} onChange={onChange} />}
              {needsProjects(slot) && <ProjectsPicker selection={selection} onChange={onChange} />}
              {needsEntities(slot) && <EntitiesPicker selection={selection} onChange={onChange} />}
              {needsTablePage(slot) && <TablePage selection={selection} onChange={onChange} />}
            </div>
          ) : (
            <small className="ayon-shell-note">
              {live ? 'Nothing to pick for this slot.' : 'From the fixture.'}
            </small>
          )}
          {isMenuSlot(slot) && (
            <Button
              icon="play_arrow"
              label="Run the menu item"
              variant="filled"
              data-shell-action="run"
              onClick={() => window.__AYON_ADDON_SHELL__?.run()}
            />
          )}
          <ContextPreview />
          {!live && <NotInFixture />}
        </>
      )}
      <Fixtures mode={mode} selection={selection} />
    </>
  )
}

export const DevPanel = ({ options, mode, selection, onChange }: DevPanelProps) => {
  // a contribution to start with
  useEffect(() => {
    if (selection.slot) return
    const first = getRegistry().contributions[0] as (AnyContribution & { id: string }) | undefined
    if (first) onChange({ ...selection, slot: first.slot as SlotName, id: first.id })
  }, [selection, onChange])

  return (
    <aside className="ayon-shell-panel" data-shell-surface="dev-panel">
      <header className="ayon-shell-panel-header">
        <Icon icon="extension" />
        <div>
          <strong>
            {options.addon.name} <span>{options.addon.version}</span>
          </strong>
          {mode === 'live' ? (
            <LiveStatus options={options} />
          ) : (
            <small>Preview: dev/fixtures/{selection.preview}.json, no server</small>
          )}
        </div>
      </header>
      {/* two scrolls: the contributions and the context are always both in view */}
      <Splitter
        layout="vertical"
        className="ayon-shell-panel-split"
        stateKey="ayon-addon-shell-panel"
        stateStorage="local"
      >
        <SplitterPanel size={55} minSize={10} className="ayon-shell-section">
          <h3>Contributions</h3>
          <Contributions
            selection={selection}
            // in preview another contribution opens live: the fixture is for one contribution
            onChange={
              mode === 'preview'
                ? (next) => {
                    window.location.href = `?slot=${next.slot}&contribution=${next.id}`
                  }
                : onChange
            }
          />
        </SplitterPanel>
        <SplitterPanel size={45} minSize={10} className="ayon-shell-section">
          <ContextPanel mode={mode} selection={selection} onChange={onChange} />
        </SplitterPanel>
      </Splitter>
    </aside>
  )
}
