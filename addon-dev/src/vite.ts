// ayonAddon(): the Vite setup of an AYON addon frontend in one plugin.
//   build: module federation (remote `name`, ./manifest exposed, every package AYON provides
//          shared, @ynput/ayon-addon with import: false), output in dist/modules/<name>
//   `ayon-addon dev --ayon`: the same build, watched, plus /ayon-addon.json for AYON's dev override
//   `ayon-addon dev`: the Vite dev server with the dev shell (standalone.ts)
import { existsSync, readFileSync, writeFileSync } from 'fs'
import path from 'path'
import type { Plugin, PluginOption, UserConfig } from 'vite'
import { findPackageDir, importFromProject, installedVersion, readAddonProject } from './project.js'
import type { RestOptions } from './rest.js'
import { standalonePlugin } from './standalone.js'

export type { RestOptions } from './rest.js'

export interface AyonAddonOptions {
  /** the federation remote name: the key in the server's `frontend_modules` */
  name: string
  /** the manifest module, exposed as ./manifest (default ./src/manifest.ts) */
  manifest?: string
  /** more modules to expose, e.g. keyword modules kept for AYON versions without slots */
  exposes?: Record<string, string>
  /** more packages to share with AYON as singletons */
  shared?: string[]
  /** where `ayon-addon preview` reads fixtures (default dev/fixtures) */
  fixtures?: string
  /** `ayon-addon generate-rest`: where the endpoints of the addon's server go */
  rest?: RestOptions
}

/** What `ayon-addon dev --ayon` serves next to the build, read by AYON's dev override. */
export interface AddonDevInfo {
  name: string
  version: string
  remote: string
  modules: string[]
  buildId: string
}

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

const readJson = (file: string) => JSON.parse(readFileSync(file, 'utf8'))

// the build's entry when the addon has no index.html: AYON loads remoteEntry.js, nothing else
const BUILD_ENTRY = '\0ayon-addon-build-entry'

const buildShared = (root: string, extra: string[] = []) => {
  const pkg = readJson(path.join(root, 'package.json'))
  const declared: Record<string, string> = { ...pkg.devDependencies, ...pkg.dependencies }
  const range = (name: string) => {
    const declaredRange = declared[name]
    if (declaredRange && /^[\^~><=\d]/.test(declaredRange)) return declaredRange
    const version = installedVersion(root, name)
    return version ? `^${version}` : false
  }

  const shared: Record<string, object> = {}
  for (const name of [...HOST_PACKAGES, ...extra]) {
    if (!installedVersion(root, name)) continue
    shared[name] = { singleton: true, requiredVersion: range(name) }
  }

  // every entry of @ynput/ayon-frontend-shared: an entry left out would bring its own api and contexts
  const sharedDir = findPackageDir(root, SHARED_PACKAGE)
  if (sharedDir) {
    const exportsMap = readJson(path.join(sharedDir, 'package.json')).exports as Record<
      string,
      { import?: string }
    >
    for (const [subpath, entry] of Object.entries(exportsMap)) {
      // skip entries the published package lists but doesn't ship
      if (!entry.import || !existsSync(path.join(sharedDir, entry.import))) continue
      shared[path.posix.join(SHARED_PACKAGE, subpath)] = {
        singleton: true,
        requiredVersion: range(SHARED_PACKAGE),
      }
    }
  }

  // always AYON's own copy: the addon bundles none, so it can't end up with a second registry
  const addonApiVersion = installedVersion(root, ADDON_API)
  if (!addonApiVersion) throw new Error(`${ADDON_API} is not installed in ${root}`)
  shared[ADDON_API] = { import: false, singleton: true, requiredVersion: `^${addonApiVersion}` }
  return shared
}

/** The Vite plugins of an AYON addon frontend. Use with @vitejs/plugin-react. */
export const ayonAddon = async (options: AyonAddonOptions): Promise<PluginOption[]> => {
  const root = process.cwd()
  const project = readAddonProject(root)
  const manifest = options.manifest || './src/manifest.ts'
  const exposes = { './manifest': manifest, ...options.exposes }
  const outDir = path.join('dist', 'modules', options.name)

  const { federation } = await importFromProject<typeof import('@module-federation/vite')>(
    root,
    '@module-federation/vite',
  )
  const federationPlugins = ([] as Plugin[]).concat(
    federation({
      name: options.name,
      filename: 'remoteEntry.js',
      exposes,
      remotes: {},
      // AYON loads the modules at runtime, it needs no federation type declarations
      dts: false,
      // use what AYON already loaded (its store, api and contexts), even when this addon was
      // built against a newer version
      shareStrategy: 'loaded-first',
      shared: buildShared(root, options.shared),
    }) as Plugin | Plugin[],
  )
  // federation only makes sense for the build AYON loads; the dev server runs on its own
  federationPlugins.forEach((plugin) => (plugin.apply = plugin.apply || 'build'))

  const config: Plugin = {
    name: 'ayon-addon',
    // the CLI reads the options from the addon's vite.config.ts (generate-rest)
    api: { options },
    config(_config, { command, mode }): UserConfig {
      return {
        base: '',
        resolve: {
          // a linked SDK must use the addon's React, router and store, never the checkout's
          dedupe: [...HOST_PACKAGES, SHARED_PACKAGE, ADDON_API],
        },
        build:
          command === 'build'
            ? {
                target: 'chrome89',
                outDir,
                emptyOutDir: true,
                cssCodeSplit: false,
                minify: mode !== 'development',
                sourcemap: mode === 'development',
                ...(existsSync(path.join(root, 'index.html'))
                  ? {}
                  : { rollupOptions: { input: { 'ayon-addon': BUILD_ENTRY } } }),
              }
            : undefined,
      }
    },
    resolveId(id) {
      if (id === BUILD_ENTRY) return id
    },
    load(id) {
      if (id === BUILD_ENTRY) return 'export {}'
    },
  }

  // `ayon-addon dev --ayon` sets AYON_ADDON_DEV: after each rebuild, tell AYON's dev override about it
  const devInfo: Plugin = {
    name: 'ayon-addon:dev-info',
    apply: 'build',
    writeBundle(outputOptions) {
      if (process.env.AYON_ADDON_DEV !== '1' || !outputOptions.dir) return
      const info: AddonDevInfo = {
        name: project.name,
        version: project.version,
        remote: options.name,
        modules: Object.keys(exposes).map((key) => key.replace(/^\.\//, '')),
        buildId: Date.now().toString(36),
      }
      writeFileSync(path.join(outputOptions.dir, 'ayon-addon.json'), JSON.stringify(info, null, 2))
    },
  }

  const standalone = standalonePlugin({
    root,
    project,
    remote: options.name,
    manifest,
    fixtures: options.fixtures || 'dev/fixtures',
  })

  return [...federationPlugins, config, devInfo, standalone]
}

export default ayonAddon
