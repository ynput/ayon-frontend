import type { EnumItem, IconModel } from '@shared/api/generated/attributes'

type EnumSource = { enum?: unknown[] | null; enumResolver?: string | null } | undefined | null

// Static options or a backend resolver both make an attribute an enum
export const hasEnumOptions = (data: EnumSource): boolean =>
  !!data?.enum?.length || !!data?.enumResolver

// Resolvers may return an IconModel where widgets expect an icon name or url
export const getEnumItemIcon = (icon: EnumItem['icon']): string | undefined => {
  if (!icon) return undefined
  if (typeof icon === 'string') return icon
  const model = icon as IconModel
  return model.type === 'url' ? model.url : model.name
}
