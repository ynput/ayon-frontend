// Preview scenes of other addons' slots (contract packages' previews.js): the scene's component on
// stage, full width, with the shell's providers around it (it renders its slots with the SDK, as
// the declaring addon does in AYON), and its fields as a form in Preview inputs. The values
// the developer changed are in the URL (ctxValues), the rest are the fields' defaults.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  Button,
  Dropdown,
  InputNumber,
  InputSwitch,
  InputText,
  InputTextarea,
} from '@ynput/ayon-react-components'
import { EntityPicker } from '@ynput/ayon-addon'
import type { PickableEntityType } from '@ynput/ayon-addon'
import { useListProjectsQuery } from '@ynput/ayon-frontend-shared/api'
import { sceneDefaults } from '../../src/contractPreviews'
import type { PreviewApi, PreviewEntity, PreviewField, PreviewPickOption } from '../../src/contractPreviews'
import type { Scene } from './contractModel'
import { useStageReady } from './status'
import type { ShellSelection } from './types'

type Values = Record<string, any>
type OnChange = (selection: ShellSelection) => void

// signed in like the shell's own requests: the dev server adds the API key, else the stored token
const signedIn = (init?: RequestInit): RequestInit => {
  const token = localStorage.getItem('accessToken')
  if (!token) return init || {}
  const headers = new Headers(init?.headers)
  if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`)
  return { ...init, headers }
}

const shellFetch = (path: string, init?: RequestInit) => window.fetch(path, signedIn(init))

// the addons of the server's production bundle, by name: their version
let addonVersions: Promise<Map<string, string>> | undefined
const loadAddonVersions = () =>
  (addonVersions ??= shellFetch('/api/bundles')
    .then((response) => (response.ok ? response.json() : { bundles: [] }))
    .then(({ bundles = [] }: { bundles?: { isProduction?: boolean; addons?: Record<string, string | null> }[] }) => {
      const production = bundles.find((bundle) => bundle.isProduction)
      return new Map(
        Object.entries(production?.addons || {}).filter((entry): entry is [string, string] => !!entry[1]),
      )
    })
    .catch(() => new Map<string, string>()))

/** What a `pick` field's `load` gets: the server, as the shell reaches it. */
export const getPreviewApi = async (): Promise<PreviewApi> => {
  const versions = await loadAddonVersions()
  return {
    fetch: shellFetch,
    addonUrl: (name) => {
      const version = versions.get(name)
      return version ? `/api/addons/${name}/${version}` : null
    },
  }
}

/**
 * A scene's values: the defaults (a project field without one starts with the shell's project, or
 * the first one), with what the developer or the scene changed on top. `setValues` merges a patch.
 */
export const useSceneValues = (scene: Scene, selection: ShellSelection, onChange: OnChange) => {
  const { data: projects = [] } = useListProjectsQuery({ active: true })
  const current = selection.projectName || projects[0]?.name || null
  const defaults = useMemo(() => sceneDefaults(scene.fields, current), [scene, current])
  const values: Values = useMemo(() => ({ ...defaults, ...selection.sceneValues }), [defaults, selection.sceneValues])
  // patches in a row (a scene setting two things at once) build on each other
  const latest = useRef(selection)
  latest.current = selection
  const setValues = useCallback(
    (patch: Values) => {
      const next = { ...latest.current, sceneValues: { ...latest.current.sceneValues, ...patch } }
      latest.current = next
      onChange(next)
    },
    [onChange],
  )
  const reset = useCallback(() => onChange({ ...latest.current, sceneValues: undefined }), [onChange])
  return { values, setValues, reset, changed: !!selection.sceneValues }
}

/** The scene on stage: its component with the values, reported to the context panel. */
export const SceneStage = ({
  scene,
  selection,
  onChange,
}: {
  scene: Scene
  selection: ShellSelection
  onChange: OnChange
}) => {
  const { values, setValues } = useSceneValues(scene, selection, onChange)
  // ready as it renders; each slot reports its context itself (slotOverlay.tsx)
  useStageReady(true)
  const Component = scene.component
  return (
    <div className="ayon-shell-body" data-shell-surface="scene" data-shell-scene={scene.key}>
      <Component values={values} setValues={setValues} />
    </div>
  )
}

const SceneField = ({ field, children }: { field: PreviewField; children: ReactNode }) => (
  <div className="ayon-shell-field" data-scene-field={field.key}>
    <label title={field.hint || field.label}>{field.label}</label>
    <div>
      {children}
      {field.hint && <small className="ayon-shell-note">{field.hint}</small>}
    </div>
  </div>
)

const NO_PROJECT = '\u0000none'

const ProjectInput = ({ field, value, onChange }: { field: PreviewField & { type: 'project' }; value: unknown; onChange: (value: string | null) => void }) => {
  const { data: projects = [] } = useListProjectsQuery({ active: true })
  const options = [
    ...(field.optional ? [{ value: NO_PROJECT, label: 'No project' }] : []),
    ...projects.map((p) => ({ value: p.name, label: p.name })),
  ]
  return (
    <Dropdown
      value={[typeof value === 'string' ? value : NO_PROJECT]}
      options={options}
      search
      onChange={(added) => onChange(added[0] === NO_PROJECT ? null : added[0])}
    />
  )
}

const EntityInput = ({
  field,
  value,
  projectName,
  onChange,
}: {
  field: PreviewField & { type: 'entity' }
  value: PreviewEntity | null
  projectName: unknown
  onChange: (value: PreviewEntity | null) => void
}) => {
  const [picking, setPicking] = useState(false)
  const project = typeof projectName === 'string' ? projectName : undefined
  return (
    <>
      <div className="ayon-shell-entities">
        <span className="ayon-shell-entity-value" title={value?.id}>
          {value ? value.label || value.name : <span className="ayon-shell-note">None</span>}
        </span>
        <Button
          icon="ads_click"
          label={value ? 'Change' : 'Pick'}
          disabled={!project}
          data-tooltip={project ? undefined : 'Pick a project first'}
          onClick={() => setPicking(true)}
        />
        {value && <Button icon="close" variant="text" aria-label="Clear" onClick={() => onChange(null)} />}
      </div>
      {picking && project && (
        <EntityPicker
          projectName={project}
          entityType={field.entityType as PickableEntityType}
          initialSelection={value ? [value] : []}
          onClose={() => setPicking(false)}
          onSubmit={([picked]) => {
            setPicking(false)
            onChange(
              picked
                ? {
                    id: picked.id,
                    name: picked.name || picked.id,
                    ...(picked.label ? { label: picked.label } : {}),
                    entityType: picked.entityType,
                    projectName: picked.projectName,
                  }
                : null,
            )
          }}
        />
      )}
    </>
  )
}

// edited as JSON: what doesn't parse is shown as an error and not applied
const JsonInput = ({ value, onChange }: { value: unknown; onChange: (value: unknown) => void }) => {
  const show = (v: unknown) => (v === undefined ? '' : JSON.stringify(v, null, 2))
  const [text, setText] = useState(() => show(value))
  const [error, setError] = useState<string>()
  // the value changed elsewhere (Reset, a pick): show it, unless the text already says it
  useEffect(() => {
    try {
      if (JSON.stringify(JSON.parse(text)) === JSON.stringify(value)) return
    } catch {
      if (error) return
    }
    setText(show(value))
    setError(undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])
  return (
    <>
      <InputTextarea
        className="ayon-shell-json"
        value={text}
        spellCheck={false}
        style={{ height: 24 + 16 * Math.min(10, Math.max(2, text.split('\n').length)) }}
        onChange={(e) => {
          setText(e.target.value)
          try {
            const parsed = e.target.value.trim() ? JSON.parse(e.target.value) : null
            setError(undefined)
            onChange(parsed)
          } catch (failed) {
            setError((failed as Error).message)
          }
        }}
      />
      {error && (
        <small className="ayon-addon-error" role="alert">
          Not applied: {error}
        </small>
      )}
    </>
  )
}

// options loaded from the server when the list opens; choosing one patches the values
const PickInput = ({
  field,
  values,
  onPick,
}: {
  field: PreviewField & { type: 'pick' }
  values: Values
  onPick: (option: PreviewPickOption) => void
}) => {
  const [options, setOptions] = useState<PreviewPickOption[]>()
  const [state, setState] = useState<{ loading?: boolean; error?: string }>({})
  const current = values[field.key]
  const load = async () => {
    setState({ loading: true })
    try {
      const loaded = await field.load(await getPreviewApi(), values)
      if (!Array.isArray(loaded)) throw new Error('load must return a list of options')
      setOptions(loaded)
      setState({})
    } catch (error) {
      setState({ error: error instanceof Error ? error.message : String(error) })
    }
  }
  const shown = options || (typeof current === 'string' ? [{ value: current, label: current, values: {} }] : [])
  return (
    <>
      <Dropdown
        value={typeof current === 'string' ? [current] : []}
        options={shown.map(({ value, label }) => ({ value, label }))}
        search
        placeholder={state.loading ? 'Loading…' : 'Pick one'}
        onOpen={load}
        onChange={(added) => {
          const option = options?.find((o) => o.value === added[0])
          if (option) onPick(option)
        }}
      />
      {state.error && (
        <small className="ayon-addon-error" role="alert">
          {state.error}
        </small>
      )}
      {options && !options.length && !state.loading && <small className="ayon-shell-note">Nothing to pick</small>}
    </>
  )
}

/** The scene's fields: what the scene builds the contexts it passes from. */
export const SceneForm = ({
  scene,
  selection,
  onChange,
}: {
  scene: Scene
  selection: ShellSelection
  onChange: OnChange
}) => {
  const { values, setValues, reset, changed } = useSceneValues(scene, selection, onChange)
  // a project changed: the entities picked in the old one no longer apply
  const setProject = (key: string, projectName: string | null) =>
    setValues({
      [key]: projectName,
      ...Object.fromEntries(
        scene.fields.filter((f) => f.type === 'entity' && f.project === key).map((f) => [f.key, null]),
      ),
    })
  const input = (field: PreviewField) => {
    const value = values[field.key]
    const set = (next: unknown) => setValues({ [field.key]: next })
    switch (field.type) {
      case 'text':
        return <InputText value={(value as string) ?? ''} onChange={(e) => set(e.target.value)} />
      case 'number':
        return (
          <InputNumber
            value={typeof value === 'number' ? value : ''}
            onChange={(e) => set(e.target.value === '' ? null : Number(e.target.value))}
          />
        )
      case 'boolean':
        return <InputSwitch checked={!!value} onChange={(e) => set((e.target as HTMLInputElement).checked)} />
      case 'select':
        return (
          <Dropdown
            value={typeof value === 'string' ? [value] : []}
            options={field.options}
            onChange={(added) => set(added[0] ?? null)}
          />
        )
      case 'multiselect':
        return (
          <Dropdown
            value={Array.isArray(value) ? value : []}
            options={field.options}
            multiSelect
            placeholder="None"
            onChange={(names) => set(names)}
          />
        )
      case 'json':
        return <JsonInput value={value} onChange={set} />
      case 'project':
        return <ProjectInput field={field} value={value} onChange={(name) => setProject(field.key, name)} />
      case 'entity':
        return (
          <EntityInput
            field={field}
            value={(value as PreviewEntity | null) ?? null}
            projectName={values[field.project]}
            onChange={set}
          />
        )
      case 'pick':
        return (
          <PickInput
            field={field}
            values={values}
            onPick={(option) => setValues({ ...option.values, [field.key]: option.value })}
          />
        )
    }
  }
  return (
    <div className="ayon-shell-fields ayon-shell-scene-fields" data-shell-scene-form={scene.key}>
      {scene.description && <small className="ayon-shell-note">{scene.description}</small>}
      {scene.fields.map((field) => (
        <SceneField key={field.key} field={field}>
          {input(field)}
        </SceneField>
      ))}
      {!scene.fields.length && <small className="ayon-shell-note">The scene has nothing to set.</small>}
      <div>
        <Button icon="restart_alt" label="Reset" variant="text" disabled={!changed} onClick={reset} />
      </div>
    </div>
  )
}
