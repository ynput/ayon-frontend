import type { EnumItem, IconModel } from '@shared/api/generated/attributes'

type EnumSource = { enum?: unknown[] | null; enumResolver?: string | null } | undefined | null

// Static options or a backend resolver both make an attribute an enum
export const hasEnumOptions = (data: EnumSource): boolean =>
  !!data?.enum?.length || !!data?.enumResolver

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

export const isEnumIconImage = (icon?: string): boolean =>
  !!icon && /^(\/|\.\/|\.\.\/|https?:\/\/)/.test(icon)
