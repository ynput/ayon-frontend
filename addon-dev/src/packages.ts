// The packages an addon shares with AYON, and those the dev server resolves to the addon's own
// copy. No imports: the unit tests load it as is.

// packages AYON provides to addons (vite federation config and src/remote/hostSharedModules.ts)
export const HOST_PACKAGES = [
  'react',
  'react-dom',
  'styled-components',
  '@ynput/ayon-react-components',
  '@reduxjs/toolkit',
  'react-redux',
  'react-router',
  'react-router-dom',
  'react-toastify',
]
export const SHARED_PACKAGE = '@ynput/ayon-frontend-shared'
export const ADDON_API = '@ynput/ayon-addon'

/**
 * Always resolved from the addon's root, whoever imports them: a linked SDK must use the addon's
 * React, router and store, never the checkout's; and a contract package's previews (imported by
 * the dev shell from wherever the package really is, often another repo with its own
 * node_modules) must render with the addon's React and SDK. A second SDK would have its own
 * registry, and the scenes' SlotOutlet would see none of the addon's contributions.
 */
export const DEDUPE = [...HOST_PACKAGES, SHARED_PACKAGE, ADDON_API]
