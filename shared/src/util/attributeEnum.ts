import type { EnumItem, IconModel } from '@shared/api/generated/attributes'

type EnumSource =
  | { enum?: unknown[] | null; enumResolver?: string | null; enumResolverSettings?: unknown }
  | undefined
  | null

// Static options or a backend resolver both make an attribute an enum
export const hasEnumOptions = (data: EnumSource): boolean =>
  !!data?.enum?.length || !!data?.enumResolver

// Static options are already there, only a resolver needs a request
export const hasEnumResolver = (data: EnumSource): boolean => !!data?.enumResolver

export const sortKeysDeep = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(sortKeysDeep)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nestedValue]) => [key, sortKeysDeep(nestedValue)]),
    )
  }
  return value
}

// Addon icons arrive as templates ("{addon_url}/icons/x.png") that only /api/actions expands
const isUnresolvedTemplate = (icon?: string) => !!icon && icon.includes('{')

// Resolvers may return an IconModel where widgets expect an icon name or url
export const getEnumItemIcon = (icon: EnumItem['icon']): string | undefined => {
  if (!icon) return undefined
  if (typeof icon === 'string') return isUnresolvedTemplate(icon) ? undefined : icon
  const model = icon as IconModel
  if (model.type !== 'url') return model.name
  return isUnresolvedTemplate(model.url) ? undefined : model.url
}

// Resolvers may return an IconModel where widgets expect a plain icon string
export const normalizeEnumItems = <T extends { icon?: EnumItem['icon'] }>(items: T[]): T[] =>
  items.map((item) => ({ ...item, icon: getEnumItemIcon(item.icon) }))

export const getEnumErrorText = (message?: string): string =>
  message ? `Could not load options: ${message}` : 'Could not load options'

// Dropdown renders its error through CSS `content: '...'`, where quotes and backslashes break out
export const toDropdownErrorText = (text?: string): string | undefined =>
  text?.replace(/'/g, '’').replace(/[\\\n]/g, ' ')

export const isEnumIconImage = (icon?: string): boolean =>
  !!icon && /^(\/|\.\/|\.\.\/|https?:\/\/)/.test(icon)

type HideableEnumItem = { value: string | number | boolean; hidden?: boolean }

// Hidden items are kept only while selected, so an existing value still shows its label
export const getSelectableEnumItems = <T extends HideableEnumItem>(
  items: T[],
  selectedValues: (string | number | boolean)[] = [],
): T[] => {
  if (!items.some((item) => item.hidden)) return items
  const selected = new Set(selectedValues.map(String))
  return items.filter((item) => !item.hidden || selected.has(String(item.value)))
}

// Params the app fills in from where the attribute is used, never from the saved resolver settings
export const ENUM_CONTEXT_PARAMS = ['project_name', 'user'] as const

export type EnumContextParam = (typeof ENUM_CONTEXT_PARAMS)[number]

type AcceptedParams = Record<string, unknown> | undefined | null

export const isEnumContextParam = (name: string): name is EnumContextParam =>
  (ENUM_CONTEXT_PARAMS as readonly string[]).includes(name)

export const getEnumContextParams = (acceptedParams: AcceptedParams): EnumContextParam[] =>
  ENUM_CONTEXT_PARAMS.filter((name) => name in (acceptedParams || {}))
