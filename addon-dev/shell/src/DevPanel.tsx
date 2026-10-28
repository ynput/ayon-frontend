// The developer panel: the addon's contributions by where they show (top), and the one on stage
// with its context: project, entities, table page (bottom). Everything here is also settable from
// the URL (params.ts), for `ayon-addon open`.
import { useEffect, useState, useSyncExternalStore } from 'react'
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
import { SLOT_GROUPS, slotGroup } from './slotGroups'
import { ENTITY_TYPES, isMenuSlot, needsEntities, needsProject, needsTablePage } from './slotNeeds'
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
      onClick={onClick}
    >
      <Icon icon={(icon || 'extension') as never} />
      <span>{contributionTitle(contribution)}</span>
      <small>{id}</small>
    </button>
  )
}

const Contributions = ({ selection, onChange }: Pick<DevPanelProps, 'selection' | 'onChange'>) => {
  const { contributions, skipped } = getRegistry()
  const [collapsed, setCollapsed] = useState<string[]>([])
  const known = SLOT_GROUPS.flatMap((group) => group.slots.map((s) => s.slot as string))
  const other = [...new Set(contributions.map((c) => c.slot))].filter((slot) => !known.includes(slot))
  const groups = other.length
    ? [...SLOT_GROUPS, { label: 'Other', icon: 'extension', slots: other.map((slot) => ({ slot, label: slot })) }]
    : SLOT_GROUPS

  return (
    <>
      {groups.map((group) => {
        const slots = group.slots
          .map(({ slot, label }) => ({ slot, label, items: contributions.filter((c) => c.slot === slot) }))
          .filter(({ items }) => items.length)
        if (!slots.length) return null
        const isCollapsed = collapsed.includes(group.label)
        return (
          <div key={group.label} className="ayon-shell-group">
            <button
              className="ayon-shell-group-header"
              onClick={() =>
                setCollapsed(
                  isCollapsed ? collapsed.filter((g) => g !== group.label) : [...collapsed, group.label],
                )
              }
            >
              <Icon icon={isCollapsed ? 'chevron_right' : 'expand_more'} />
              <Icon icon={group.icon as never} />
              <span>{group.label}</span>
              <small>{slots.reduce((count, { items }) => count + items.length, 0)}</small>
            </button>
            {!isCollapsed &&
              slots.map(({ slot, label, items }) => (
                <div key={slot} className="ayon-shell-slot">
                  <div className="ayon-shell-slot-label" title={SLOT_DOCS[slot as SlotName]?.where}>
                    {label} <code>{slot}</code>
                  </div>
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
          </div>
        )
      })}
      {skipped.length > 0 && (
        <>
          <h3>Skipped</h3>
          {skipped.map((s) => (
            <div key={`${s.slot}:${s.id}`} className="ayon-addon-error" role="alert">
              {s.slot} {s.id}: {s.reason}
            </div>
          ))}
        </>
      )}
    </>
  )
}

const ProjectPicker = ({ selection, onChange }: Pick<DevPanelProps, 'selection' | 'onChange'>) => {
  const { data: projects = [] } = useListProjectsQuery({ active: true })
  // a project to start with
  useEffect(() => {
    if (!selection.projectName && projects.length) {
      onChange({ ...selection, projectName: projects[0].name, entities: [] })
    }
  }, [projects, selection, onChange])

  return (
    <>
      <h3>Project</h3>
      <Dropdown
        value={selection.projectName ? [selection.projectName] : []}
        options={projects.map((p) => ({ value: p.name, label: p.name }))}
        search
        onChange={(added) => onChange({ ...selection, projectName: added[0], entities: [] })}
      />
    </>
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
    <>
      <h3>Entities</h3>
      <Dropdown
        value={[entityType]}
        options={ENTITY_TYPES.map((type) => ({ value: type, label: type }))}
        onChange={(added) => onChange({ ...selection, entityType: added[0], entities: [] })}
      />
      {entities.map((entity) => (
        <div key={entity.id} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {entity.label || entity.name || entity.id}
          </span>
          <Button
            icon="close"
            variant="text"
            onClick={() =>
              onChange({ ...selection, entities: entities.filter((e) => e.id !== entity.id) })
            }
          />
        </div>
      ))}
      <Button icon="ads_click" label="Pick entities" onClick={() => setPicking(true)} />
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
    </>
  )
}

const TablePage = ({ selection, onChange }: Pick<DevPanelProps, 'selection' | 'onChange'>) => (
  <>
    <h3>Table page</h3>
    <Dropdown
      value={[selection.page || 'overview']}
      options={['overview', 'products', 'lists'].map((page) => ({ value: page, label: page }))}
      onChange={(added) => onChange({ ...selection, page: added[0] as ShellSelection['page'] })}
    />
  </>
)

const SaveFixture = ({ selection }: { selection: ShellSelection }) => {
  const [name, setName] = useState('')
  const [saved, setSaved] = useState<string>()
  const save = async () => {
    const fixture = window.__AYON_ADDON_SHELL__?.fixture()
    if (!fixture || !name) return
    const response = await fetch(`/__ayon-addon/fixtures/${encodeURIComponent(name)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fixture, null, 2),
    })
    setSaved(response.ok ? `dev/fixtures/${name}.json` : `failed: ${response.status}`)
  }
  if (!selection.slot || !selection.id) return null
  return (
    <>
      <h3>Preview fixture</h3>
      <div style={{ display: 'flex', gap: 4 }}>
        <InputText
          value={name}
          placeholder={`${selection.id}`}
          onChange={(e) => setName(e.target.value.replace(/[^\w-]/g, ''))}
          style={{ flex: 1 }}
        />
        <Button icon="save" label="Save" disabled={!name} onClick={save} />
      </div>
      {saved && <small>{saved}</small>}
    </>
  )
}

// the saved fixtures, each opens in preview
const Fixtures = ({ current }: { current?: string }) => {
  const [names, setNames] = useState<string[]>([])
  useEffect(() => {
    fetch('/__ayon-addon/fixtures')
      .then((response) => (response.ok ? response.json() : []))
      .then(setNames)
      .catch(() => setNames([]))
  }, [])
  if (!names.length) return null
  return (
    <>
      <h3>Previews</h3>
      {names.map((name) => (
        <a
          key={name}
          href={`?preview=${encodeURIComponent(name)}`}
          style={{ fontWeight: name === current ? 'bold' : undefined }}
        >
          {name}
        </a>
      ))}
      {current && <a href="?">back to live</a>}
    </>
  )
}

const LiveStatus = ({ options }: { options: ShellOptions }) => {
  const { data: user } = useGetCurrentUserQuery()
  return (
    <small>
      {user?.name} at {options.serverUrl}
      {options.signedInWithKey ? ' (API key)' : ''}
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
    <>
      <h3>Not in the fixture</h3>
      <pre className="ayon-shell-code">{unmatched}</pre>
    </>
  )
}

// a few lines of the context; the whole of it in a dialog
const ContextPreview = () => {
  const context = useSyncExternalStore(subscribeStage, getStageContext)
  const [open, setOpen] = useState(false)
  const text = showContext(context)
  return (
    <>
      <h3>Context</h3>
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
    </>
  )
}

// what the contribution on stage is, and the context the shell gives it
const ContextPanel = ({ mode, selection, onChange }: Omit<DevPanelProps, 'options'>) => {
  const contribution = getRegistry().contributions.find(
    (c) => c.slot === selection.slot && idOf(c) === selection.id,
  )
  if (!contribution) return <small className="ayon-shell-note">Pick a contribution.</small>
  const slot = contribution.slot
  const { group, label } = slotGroup(slot)
  const live = mode === 'live'
  return (
    <>
      <h3>On stage</h3>
      <div className="ayon-shell-onstage">
        <strong>{contributionTitle(contribution)}</strong>
        <small>
          {group ? `${group.label} › ${label}` : label} · <code>{slot}</code>
        </small>
        <small>{SLOT_DOCS[slot as SlotName]?.where}</small>
      </div>
      {live && needsProject(slot) && <ProjectPicker selection={selection} onChange={onChange} />}
      {live && needsEntities(slot) && <EntitiesPicker selection={selection} onChange={onChange} />}
      {live && needsTablePage(slot) && <TablePage selection={selection} onChange={onChange} />}
      {slot === 'studio.page' && (
        <small className="ayon-shell-note">
          selectedProjects comes from the page itself: a ProjectList in its sidebar sets it, as on
          AYON&apos;s dashboard.
        </small>
      )}
      {isMenuSlot(slot) && (
        <Button
          icon="play_arrow"
          label="Run"
          data-shell-action="run"
          onClick={() => window.__AYON_ADDON_SHELL__?.run()}
        />
      )}
      <ContextPreview />
      {!live && <NotInFixture />}
      {live && <SaveFixture selection={selection} />}
      <Fixtures current={selection.preview} />
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
        <strong>
          {options.addon.name} {options.addon.version}
        </strong>
        {mode === 'live' ? (
          <LiveStatus options={options} />
        ) : (
          <small>preview: dev/fixtures/{selection.preview}.json, no server</small>
        )}
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
