// Shared types for Bundles pages

export type AddonVersionMeta = {
  hasSettings: boolean
  hasSiteSettings: boolean
  frontendScopes: Record<string, unknown>
  isBroken: boolean
  projectCanOverrideAddonVersion: boolean
}

export type Addon = {
  name: string
  title?: string
  versions: Record<string, AddonVersionMeta>
  description?: string
  productionVersion?: string | null
  stagingVersion?: string | null
  addonType: 'pipeline' | 'server' | string
  system?: boolean
  projectCanOverrideAddonVersion: boolean
  // current selected version (may be present in rows/selection)
  version?: string
}
