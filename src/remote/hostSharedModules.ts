import { registerShared } from '@module-federation/enhanced/runtime'
import * as reduxToolkit from '@reduxjs/toolkit'
import * as reactRedux from 'react-redux'
import * as reactToastify from 'react-toastify'
import * as primeConfirmDialog from 'primereact/confirmdialog'
import * as addonApi from '@ynput/ayon-addon'
import { dependencies } from '../../package.json'
import { version } from '../../shared/package.json'
import { version as addonApiVersion } from '../../addon/package.json'
import { routerExports } from './hostRouterExports'

// Addons import @ynput/ayon-frontend-shared, @reduxjs/toolkit, react-redux, react-router,
// react-toastify, primereact/confirmdialog and @ynput/ayon-addon. Providing the host's own modules
// under those names makes addons that share them use the host's instances: one RTK Query api and
// cache, one root reducer, the same React contexts, the host's router, its toast container, its
// confirm dialog and one slot registry.
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
  'ProjectsTable',
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
    // the router contexts live in react-router, react-router-dom re-exports them
    'react-router': share(dependencies['react-router'], async () => asLib(routerExports)),
    'react-router-dom': share(dependencies['react-router-dom'], async () => asLib(routerExports)),
    // toast() only reaches a ToastContainer from the same copy of the package
    'react-toastify': share(dependencies['react-toastify'], async () => asLib(reactToastify)),
    // confirmDialog() opens every ConfirmDialog from the same copy of primereact: with the host's,
    // an addon's confirms open the host's app-level dialog, and the addon mounts none
    'primereact/confirmdialog': share(dependencies['primereact'], async () =>
      asLib(primeConfirmDialog),
    ),
    // the addon API: addons list it with import: false, so this is the only copy they ever get
    '@ynput/ayon-addon': share(addonApiVersion, async () => asLib(addonApi)),
    ...Object.fromEntries(
      ENTRY_NAMES.map((entry) => [
        entry === 'index' ? PACKAGE : `${PACKAGE}/${entry}`,
        share(version, () => loadEntries().then((entries) => asLib(entries[entry]))),
      ]),
    ),
  })
