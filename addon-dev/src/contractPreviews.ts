// The previews of a contract package (`"ayonAddon": { "previews": "./previews.js" }`): scenes, mock
// UIs of the declaring addon that render its slots with the SDK as the addon does in AYON, and the
// context they pass as a form. A contributor's dev shell renders them, so an addon can be developed
// against another addon's slots without that addon installed.
//
//   export const previews = [{
//     id: 'card', label: 'A card on the board', slots: ['example.cardBadge'],
//     fields: [{ key: 'title', label: 'Title', type: 'text', default: 'Layout' }],
//     component: ({ values, setValues }) => ..., // renders <SlotOutlet slot="example.cardBadge" ... />
//   }]
//
// No imports: `ayon-addon check` (Node) and the dev shell (browser) both use it.

export const PREVIEW_ENTITY_TYPES = ['task', 'folder', 'product', 'version'] as const

export interface PreviewOption {
  value: string
  label: string
}

/** What a scene's `api` gives a `pick` field's `load`. */
export interface PreviewApi {
  /** a request to the AYON server the shell uses, signed in like the shell */
  fetch(path: string, init?: RequestInit): Promise<Response>
  /** `/api/addons/<name>/<version>` of that addon on the server, null when it isn't installed */
  addonUrl(name: string): string | null
}

/** An option of a `pick` field: choosing it sets the field to `value` and patches the values. */
export interface PreviewPickOption extends PreviewOption {
  values: Record<string, unknown>
}

export type PreviewField = { key: string; label: string; hint?: string } & (
  | { type: 'text'; default?: string }
  | { type: 'number'; default?: number }
  | { type: 'boolean'; default?: boolean }
  | { type: 'select'; options: PreviewOption[]; default?: string }
  | { type: 'multiselect'; options: PreviewOption[]; default?: string[] }
  | { type: 'json'; default?: unknown }
  | { type: 'project'; optional?: boolean; default?: string | null }
  | { type: 'entity'; entityType: (typeof PREVIEW_ENTITY_TYPES)[number]; project: string }
  | {
      type: 'pick'
      load: (api: PreviewApi, values: Record<string, unknown>) => Promise<PreviewPickOption[]>
    }
)

export type PreviewFieldType = PreviewField['type']

/** A scene as the shell renders it; `component` gets `{ values, setValues }`. */
export interface PreviewScene {
  id: string
  label: string
  description?: string
  /** slots of this package the scene renders */
  slots: string[]
  fields: PreviewField[]
  component: unknown
}

/** The value of an `entity` field. */
export interface PreviewEntity {
  id: string
  name: string
  label?: string
  entityType: string
  projectName: string
}

const FIELD_TYPES: PreviewFieldType[] = [
  'text',
  'number',
  'boolean',
  'select',
  'multiselect',
  'json',
  'project',
  'entity',
  'pick',
]

const isObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)

const describe = (value: unknown) =>
  value === null ? 'null' : Array.isArray(value) ? 'a list' : typeof value

const isText = (value: unknown): value is string => typeof value === 'string' && !!value

type Problem = { scene?: string; reason: string }

// what is wrong with one field; `fields` are the scene's, for an entity field's project
const fieldProblems = (field: unknown, fields: unknown[]): string[] => {
  if (!isObject(field)) return [`must be an object, not ${describe(field)}`]
  const problems: string[] = []
  if (!isText(field.label)) problems.push('label must be a string')
  if (field.hint !== undefined && typeof field.hint !== 'string') problems.push('hint must be a string')
  const type = field.type as PreviewFieldType
  if (!FIELD_TYPES.includes(type)) {
    return [...problems, `type must be one of ${FIELD_TYPES.join(', ')}, not ${JSON.stringify(field.type)}`]
  }
  const fallback = field.default
  const has = fallback !== undefined
  const options = Array.isArray(field.options) ? field.options : undefined
  const values = (options || []).filter(isObject).map((option) => option.value)
  const optionsProblem = () => {
    if (!options?.length) return problems.push('options must be a list with at least one option')
    options.forEach((option, index) => {
      if (!isObject(option) || !isText(option.value) || typeof option.label !== 'string') {
        problems.push(`option ${index + 1} must be { value, label } with string values`)
      }
    })
  }
  switch (type) {
    case 'text':
      if (has && typeof fallback !== 'string') problems.push(`default must be a string, not ${describe(fallback)}`)
      break
    case 'number':
      if (has && (typeof fallback !== 'number' || !Number.isFinite(fallback))) {
        problems.push(`default must be a number, not ${describe(fallback)}`)
      }
      break
    case 'boolean':
      if (has && typeof fallback !== 'boolean') problems.push(`default must be true or false, not ${describe(fallback)}`)
      break
    case 'select':
      optionsProblem()
      if (has && !values.includes(fallback)) problems.push(`default ${JSON.stringify(fallback)} is not one of the options`)
      break
    case 'multiselect':
      optionsProblem()
      if (has && (!Array.isArray(fallback) || fallback.some((value) => !values.includes(value)))) {
        problems.push('default must be a list of option values')
      }
      break
    case 'project':
      if (field.optional !== undefined && typeof field.optional !== 'boolean') {
        problems.push('optional must be true or false')
      }
      if (has && fallback !== null && typeof fallback !== 'string') {
        problems.push(`default must be a project name or null, not ${describe(fallback)}`)
      }
      if (fallback === null && !field.optional) problems.push('default null ("No project") needs optional: true')
      break
    case 'entity': {
      if (!PREVIEW_ENTITY_TYPES.includes(field.entityType as never)) {
        problems.push(`entityType must be one of ${PREVIEW_ENTITY_TYPES.join(', ')}`)
      }
      const project = fields.find((other) => isObject(other) && other.key === field.project)
      if (!isObject(project) || project.type !== 'project') {
        problems.push(`project must be the key of a project field of the scene, not ${JSON.stringify(field.project)}`)
      }
      if (has) problems.push('an entity field has no default: it starts empty')
      break
    }
    case 'pick':
      if (typeof field.load !== 'function') problems.push(`load must be a function, not ${describe(field.load)}`)
      if (has) problems.push('a pick field has no default: it starts empty')
      break
  }
  return problems
}

/**
 * What is wrong with a previews export: not a list, scenes without a unique id or a label, slots
 * the package doesn't declare, malformed fields, a component that isn't a function.
 */
export const checkPreviews = (
  previews: unknown,
  declared: readonly string[],
  entry = 'the previews module',
): Problem[] => {
  if (previews === undefined) return [{ reason: `${entry} does not export "previews"` }]
  if (!Array.isArray(previews)) {
    return [{ reason: `"previews" must be a list of scenes, not ${describe(previews)}` }]
  }
  const problems: Problem[] = []
  const ids = new Set<string>()
  previews.forEach((scene, index) => {
    const name = isObject(scene) && isText(scene.id) ? scene.id : `scene ${index + 1}`
    const problem = (reason: string) => problems.push({ scene: name, reason })
    if (!isObject(scene)) return problem(`must be an object, not ${describe(scene)}`)
    if (!isText(scene.id)) problem('id must be a string')
    else if (ids.has(scene.id)) problem('id is not unique')
    else ids.add(scene.id)
    if (!isText(scene.label)) problem('label must be a string')
    if (scene.description !== undefined && typeof scene.description !== 'string') {
      problem('description must be a string')
    }
    if (!Array.isArray(scene.slots) || !scene.slots.length) {
      problem('slots must be a list of the slots it renders')
    } else {
      for (const slot of scene.slots) {
        if (!declared.includes(slot as string)) {
          problem(
            `${JSON.stringify(slot)} is not a slot of this package (it declares ${
              declared.length ? declared.join(', ') : 'none'
            })`,
          )
        }
      }
    }
    if (typeof scene.component !== 'function') {
      problem(`component must be a component (a function), not ${describe(scene.component)}`)
    }
    if (!Array.isArray(scene.fields)) return problem('fields must be a list (empty for none)')
    const keys = new Set<string>()
    scene.fields.forEach((field: unknown, at: number) => {
      const key = isObject(field) && isText(field.key) ? field.key : undefined
      const label = `field ${key ? JSON.stringify(key) : at + 1}`
      if (!key) problem(`${label}: key must be a string`)
      else if (keys.has(key)) problem(`${label}: key is not unique`)
      else keys.add(key)
      fieldProblems(field, scene.fields as unknown[]).forEach((reason) => problem(`${label}: ${reason}`))
    })
  })
  return problems
}

/**
 * The scenes the shell can render: an id, a label, a component and slots of the package. Their
 * malformed fields are left out (checkPreviews reports them).
 */
export const validScenes = (previews: unknown, declared: readonly string[]): PreviewScene[] => {
  if (!Array.isArray(previews)) return []
  const seen = new Set<string>()
  return previews.flatMap((scene): PreviewScene[] => {
    if (!isObject(scene) || !isText(scene.id) || !isText(scene.label) || seen.has(scene.id)) return []
    if (typeof scene.component !== 'function') return []
    const slots = Array.isArray(scene.slots) ? scene.slots.filter((slot) => declared.includes(slot)) : []
    if (!slots.length) return []
    seen.add(scene.id)
    const all = Array.isArray(scene.fields) ? (scene.fields as unknown[]) : []
    const keys = new Set<string>()
    const fields = all.filter((field): field is PreviewField => {
      if (!isObject(field) || !isText(field.key) || keys.has(field.key)) return false
      keys.add(field.key)
      return !fieldProblems(field, all).length
    })
    return [
      {
        id: scene.id,
        label: scene.label,
        description: typeof scene.description === 'string' ? scene.description : undefined,
        slots,
        fields,
        component: scene.component,
      },
    ]
  })
}

/**
 * A scene's values before the developer changes any: each field's `default`, else empty (`''`,
 * `false`, `[]` or null). A `project` field without a default is `currentProject` (the shell's),
 * or null when it is optional.
 */
export const sceneDefaults = (
  fields: readonly PreviewField[],
  currentProject?: string | null,
): Record<string, unknown> =>
  Object.fromEntries(
    fields.map((field) => {
      if ('default' in field && field.default !== undefined) return [field.key, field.default]
      switch (field.type) {
        case 'text':
          return [field.key, '']
        case 'boolean':
          return [field.key, false]
        case 'multiselect':
          return [field.key, []]
        case 'project':
          return [field.key, field.optional ? null : currentProject ?? null]
        default:
          return [field.key, null]
      }
    }),
  )

/** The values the developer changed, for the URL (`ctxValues`): JSON, nothing when none. */
export const encodeSceneValues = (changed?: Record<string, unknown>) =>
  changed && Object.keys(changed).length ? JSON.stringify(changed) : undefined

/** Back from the URL: an object, or nothing when the text isn't one. */
export const decodeSceneValues = (text?: string | null): Record<string, unknown> | undefined => {
  if (!text) return undefined
  try {
    const value = JSON.parse(text)
    return isObject(value) ? value : undefined
  } catch {
    return undefined
  }
}
