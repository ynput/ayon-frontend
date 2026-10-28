// The developer panel: which contribution is on stage, and its context (project, entities,
// table page). Everything here is also settable from the URL (params.ts), for `ayon-addon open`.
import { useEffect, useState, useSyncExternalStore } from 'react'
import { Button, Dropdown, InputText } from '@ynput/ayon-react-components'
import { getRegistry } from '@ynput/ayon-addon/host'
import type { AnyContribution, EntityRef, SlotName } from '@ynput/ayon-addon'
import {
  useGetCurrentUserQuery,
  useGetEntitiesDetailsPanelQuery,
  useListProjectsQuery,
} from '@ynput/ayon-frontend-shared/api'
import { EntityPickerDialog } from '@ynput/ayon-frontend-shared/EntityPickerDialog'
import {
  ProjectContextProvider,
  ProjectFoldersContextProvider,
} from '@ynput/ayon-frontend-shared/context'
import { clearAccessToken } from '@ynput/ayon-frontend-shared/util'
import { getUnmatched, onUnmatched } from './network'
import { ENTITY_TYPES, isMenuSlot, needsEntities, needsProject, needsTablePage } from './slotNeeds'
import { getStageContext, subscribeStage } from './status'
import type { ShellOptions, ShellSelection } from './types'

interface DevPanelProps {
  options: ShellOptions
  mode: 'live' | 'preview'
  selection: ShellSelection
  onChange: (selection: ShellSelection) => void
}

const contributionLabel = (contribution: AnyContribution) => {
  const fields = contribution as { title?: string; label?: string; tooltip?: string }
  return fields.title || fields.label || fields.tooltip || ''
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

const Contributions = ({ selection, onChange }: Pick<DevPanelProps, 'selection' | 'onChange'>) => {
  const { contributions, skipped } = getRegistry()
  const slots = [...new Set(contributions.map((c) => c.slot))]
  return (
    <>
      <h3>Contributions</h3>
      {slots.map((slot) => (
        <div key={slot}>
          <small style={{ color: 'var(--md-sys-color-outline)' }}>{slot}</small>
          {contributions
            .filter((c) => c.slot === slot)
            .map((c) => {
              const id = (c as { id: string }).id
              const selected = selection.slot === slot && selection.id === id
              return (
                <button
                  key={`${slot}:${id}`}
                  className={`contribution${selected ? ' selected' : ''}`}
                  data-contribution={`${slot}:${id}`}
                  onClick={() => onChange({ ...selection, slot: slot as SlotName, id })}
                >
                  <span>{id}</span>
                  <small>{contributionLabel(c)}</small>
                </button>
              )
            })}
        </div>
      ))}
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

const PreviewStatus = ({ selection }: { selection: ShellSelection }) => {
  const unmatched = useSyncExternalStore(onUnmatched, () => getUnmatched().join('\n'))
  return (
    <>
      <small>preview: dev/fixtures/{selection.preview}.json, no server</small>
      {unmatched && (
        <>
          <h3>Not in the fixture</h3>
          <pre>{unmatched}</pre>
        </>
      )}
    </>
  )
}

export const DevPanel = ({ options, mode, selection, onChange }: DevPanelProps) => {
  const context = useSyncExternalStore(subscribeStage, getStageContext)
  // a contribution to start with
  useEffect(() => {
    if (selection.slot) return
    const first = getRegistry().contributions[0] as (AnyContribution & { id: string }) | undefined
    if (first) onChange({ ...selection, slot: first.slot as SlotName, id: first.id })
  }, [selection, onChange])

  return (
    <aside className="ayon-shell-panel" data-shell-surface="dev-panel">
      <div>
        <strong>
          {options.addon.name} {options.addon.version}
        </strong>
        <div>
          {mode === 'live' ? <LiveStatus options={options} /> : <PreviewStatus selection={selection} />}
        </div>
      </div>
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
      {mode === 'live' && needsProject(selection.slot) && (
        <ProjectPicker selection={selection} onChange={onChange} />
      )}
      {mode === 'live' && needsEntities(selection.slot) && (
        <EntitiesPicker selection={selection} onChange={onChange} />
      )}
      {mode === 'live' && needsTablePage(selection.slot) && (
        <TablePage selection={selection} onChange={onChange} />
      )}
      {isMenuSlot(selection.slot) && (
        <Button
          icon="play_arrow"
          label="Run"
          data-shell-action="run"
          onClick={() => window.__AYON_ADDON_SHELL__?.run()}
        />
      )}
      <h3>Context</h3>
      <pre data-shell-context>{showContext(context)}</pre>
      {mode === 'live' && <SaveFixture selection={selection} />}
      <Fixtures current={selection.preview} />
    </aside>
  )
}
