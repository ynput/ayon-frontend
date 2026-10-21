import { registerShared } from '@module-federation/enhanced/runtime'
import * as reduxToolkit from '@reduxjs/toolkit'
import * as reactRedux from 'react-redux'
import { dependencies } from '../../package.json'
import { version } from '../../shared/package.json'

// Addons import @ynput/ayon-frontend-shared, @reduxjs/toolkit and react-redux. Providing the
// host's own modules under those names makes addons that share them use the host's instances:
// one RTK Query api and cache, one root reducer, and the same React contexts.
// See src/remote/AGENTS.md.

const PACKAGE = '@ynput/ayon-frontend-shared'

// The shared entries, all in one lazy module (hostSharedEntries.ts)
const loadEntries = () => import('./hostSharedEntries').then((module) => module.entries)
const ENTRY_NAMES = [
  'index',
  'api',
  'components',
  'util',
  'hooks',
  'context',
  'Actions',
  'ContextMenu',
  'DetailsPanel',
  'Feed',
  'ProjectTreeTable',
  'RepresentationsList',
  'Slicer',
  'Views',
  'SimpleTable',
  'EntityPickerDialog',
  'ListTable',
  'NewEntity',
]

// __esModule: @module-federation/vite before 1.14 reads shared modules as CommonJS and takes
// the whole namespace as the default export without it
const asLib = (module: unknown) => {
  const lib = { __esModule: true, ...(module as object) }
  return () => lib
}

const share = (pkgVersion: string, get: () => Promise<() => unknown>) => ({
  version: pkgVersion,
  get,
  // Counts as loaded, so the runtime picks it over an addon's own copy even when the addon was
  // built against a newer version (it only warns).
  loaded: true,
  shareConfig: { singleton: true, requiredVersion: false as const },
})

// Must run before any remote is registered.
export const shareHostModules = () =>
  registerShared({
    // already in the main bundle. Not in the federation plugin's shared config, which would
    // put every host import of them behind an async share load at startup.
    '@reduxjs/toolkit': share(dependencies['@reduxjs/toolkit'], async () => asLib(reduxToolkit)),
    'react-redux': share(dependencies['react-redux'], async () => asLib(reactRedux)),
    ...Object.fromEntries(
      ENTRY_NAMES.map((entry) => [
        entry === 'index' ? PACKAGE : `${PACKAGE}/${entry}`,
        share(version, () => loadEntries().then((entries) => asLib(entries[entry]))),
      ]),
    ),
  })
