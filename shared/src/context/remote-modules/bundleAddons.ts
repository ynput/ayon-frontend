import type { AddonListItem, BundleModel, FrontendModuleListItem } from '@shared/api'
import type { BundleMode } from '@shared/util'

// addon name -> version
export type AddonVersions = Record<string, string>

export type BundleAddons = {
  variant: BundleMode
  versions: AddonVersions
}

// The addons of the bundle a user in this mode gets. Only the user's own dev bundle counts:
// without one the server sends production.
export const resolveBundleAddons = (
  addons: AddonListItem[],
  bundles: BundleModel[],
  mode: BundleMode,
  userName?: string,
): BundleAddons => {
  if (mode === 'developer') {
    const devBundle = bundles.find((bundle) => bundle.isDev && bundle.activeUser === userName)
    if (devBundle) {
      const versions: AddonVersions = {}
      for (const [name, version] of Object.entries(devBundle.addons ?? {})) {
        if (version) versions[name] = version
      }
      return { variant: 'developer', versions }
    }
  }

  const variant = mode === 'staging' ? 'staging' : 'production'
  const versions: AddonVersions = {}
  for (const addon of addons) {
    const version = variant === 'staging' ? addon.stagingVersion : addon.productionVersion
    if (version) versions[addon.name] = version
  }
  return { variant, versions }
}

// classic addon pages: their tabs come from the version's frontendScopes, not from remote modules
const hasClassicPages = (addons: AddonListItem[], name: string, version?: string) => {
  const definition = addons.find((addon) => addon.name === name)
  const scopes = version ? definition?.versions?.[version]?.frontendScopes : undefined
  return !!scopes && Object.keys(scopes).length > 0
}

const moduleVersions = (modules: FrontendModuleListItem[]): AddonVersions =>
  Object.fromEntries(modules.map((addon) => [addon.addonName, addon.addonVersion]))

const describeChanges = (from: AddonVersions, to: AddonVersions, include: (name: string) => boolean) =>
  [...new Set([...Object.keys(from), ...Object.keys(to)])]
    .filter((name) => from[name] !== to[name] && include(name))
    .map((name) => (to[name] ? `${name} ${to[name]}` : `${name} removed`))

// What differs from what the page loaded: addons added to the bundle, removed from it, or in
// another version. Addons with neither remote modules nor classic pages don't change the page.
export const getAddonChanges = (
  registered: { modules: FrontendModuleListItem[]; bundle?: BundleAddons },
  live: { modules: FrontendModuleListItem[]; bundle?: BundleAddons; addons: AddonListItem[] },
): string[] => {
  const changes = describeChanges(
    moduleVersions(registered.modules),
    moduleVersions(live.modules),
    () => true,
  )

  if (registered.bundle && live.bundle) {
    const from = registered.bundle.versions
    const to = live.bundle.versions
    changes.push(
      ...describeChanges(
        from,
        to,
        (name) =>
          hasClassicPages(live.addons, name, from[name]) ||
          hasClassicPages(live.addons, name, to[name]),
      ),
    )
  }

  return [...new Set(changes)]
}
