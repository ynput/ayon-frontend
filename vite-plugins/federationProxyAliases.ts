import type { Plugin } from 'vite'

// an import from a shared CommonJS proxy chunk, e.g. React required by use-sync-external-store
const PROXY_IMPORT = /import\s*\{([^}]+)\}\s*from\s*["']([^"']*__loadShare__[^"']*commonjs-proxy[^"']*)["']/g

type Alias = { source: string; imported: string; local: string }

const parseSpec = (spec: string) => {
  const [imported, local = imported] = spec.trim().split(/\s+as\s+/)
  return { imported, local }
}

const dollarAliases = (code: string): Alias[] =>
  Array.from(code.matchAll(PROXY_IMPORT)).flatMap(([, specs, source]) =>
    specs
      .split(',')
      .map(parseSpec)
      .filter(({ local }) => local.startsWith('$'))
      .map((alias) => ({ ...alias, source })),
  )

/**
 * After minification, @module-federation/vite 1.14 rewrites imports from shared CommonJS proxies
 * and renames an alias it thinks is unused. Its check, `\b<alias>\b`, never matches a name that
 * starts with `$`, so an alias like `$g` was renamed while the code still used it: "$g is not
 * defined" and a blank app. This notes those aliases before the plugin's generateBundle and puts
 * them back after it. Fixed upstream in 1.20.9; remove this once the plugin is upgraded.
 */
export const keepProxyAliases = (): Plugin[] => {
  const aliases = new Map<string, Alias[]>()
  return [
    {
      name: 'ayon:keep-proxy-aliases-before',
      apply: 'build',
      generateBundle: {
        order: 'pre',
        handler(_, bundle) {
          aliases.clear()
          Object.values(bundle).forEach((chunk) => {
            if (chunk.type !== 'chunk') return
            const found = dollarAliases(chunk.code)
            if (found.length) aliases.set(chunk.fileName, found)
          })
        },
      },
    },
    {
      name: 'ayon:keep-proxy-aliases-after',
      apply: 'build',
      generateBundle: {
        order: 'post',
        handler(_, bundle) {
          aliases.forEach((chunkAliases, fileName) => {
            const chunk = bundle[fileName]
            if (chunk?.type !== 'chunk') return
            chunk.code = chunk.code.replace(PROXY_IMPORT, (statement, specs: string, source: string) => {
              const restored = specs.split(',').map((spec) => {
                const { imported, local } = parseSpec(spec)
                const alias = chunkAliases.find((a) => a.source === source && a.imported === imported)
                return alias && alias.local !== local ? `${imported} as ${alias.local}` : spec
              })
              return statement.replace(specs, () => restored.join(','))
            })
          })
        },
      },
    },
  ]
}
