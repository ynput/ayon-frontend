// The previews of a contract package (`"ayonAddon": { "previews": "./previews.js" }`): for slots it
// declares, the contexts the dev shell renders a contributor's contributions with, so an addon can
// be developed against another addon's slot without that addon installed.
//
//   export const previews = {
//     'example.cardBadge': {
//       frame: ({ context, children }) => createElement('div', { className: 'card' }, children),
//       cases: [{ label: 'A task card', context: { projectName: 'demo', entities: [...] } }],
//     },
//   }
//
// No imports: `ayon-addon check` (Node) and the dev shell (browser) both use it.

/** One context to render a contribution with, picked by its label in the developer panel. */
export interface PreviewCase {
  label: string
  context: Record<string, unknown>
}

/** The previews of one slot. `frame` is a component: ({ context, children }) => element. */
export interface SlotPreview {
  /** a stand-in of the declaring addon's UI around the slot; `children` is where it goes */
  frame?: unknown
  cases: PreviewCase[]
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)

const describe = (value: unknown) =>
  value === null ? 'null' : Array.isArray(value) ? 'a list' : typeof value

/**
 * What is wrong with a previews export: slots the package doesn't declare, missing or empty
 * `cases`, a case without a label or a context object, a `frame` that isn't a component.
 */
export const checkPreviews = (
  previews: unknown,
  declared: readonly string[],
  entry = 'the previews module',
): { slot?: string; reason: string }[] => {
  if (previews === undefined) return [{ reason: `${entry} does not export "previews"` }]
  if (!isObject(previews)) {
    return [
      { reason: `"previews" must be an object keyed by slot name, not ${describe(previews)}` },
    ]
  }
  const problems: { slot?: string; reason: string }[] = []
  for (const [slot, preview] of Object.entries(previews)) {
    const problem = (reason: string) => problems.push({ slot, reason })
    if (!declared.includes(slot)) {
      problem(
        `not a slot of this package (it declares ${
          declared.length ? declared.join(', ') : 'none'
        })`,
      )
      continue
    }
    if (!isObject(preview)) {
      problem(`must be an object with "cases", not ${describe(preview)}`)
      continue
    }
    if (preview.frame !== undefined && typeof preview.frame !== 'function') {
      problem(`frame must be a component (a function), not ${describe(preview.frame)}`)
    }
    const { cases } = preview
    if (!Array.isArray(cases) || !cases.length) {
      problem('cases must be a list with at least one case')
      continue
    }
    cases.forEach((item, index) => {
      const at = `case ${index + 1}`
      if (!isObject(item)) return problem(`${at} must be an object, not ${describe(item)}`)
      if (typeof item.label !== 'string' || !item.label) problem(`${at}: label must be a string`)
      if (!isObject(item.context)) {
        problem(`${at}: context must be an object, not ${describe(item.context)}`)
      }
    })
  }
  return problems
}

/** The cases the shell can render: those with a label and a context object. */
export const validCases = (preview: unknown): PreviewCase[] => {
  const cases = isObject(preview) && Array.isArray(preview.cases) ? preview.cases : []
  return cases.filter(
    (item): item is PreviewCase =>
      isObject(item) && typeof item.label === 'string' && !!item.label && isObject(item.context),
  )
}
