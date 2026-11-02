import path from 'path'
import type { Plugin } from 'vite'

/**
 * The app imports named functions from 'lodash', which is CommonJS and can't be tree shaken,
 * so all of lodash (~560 KB minified) ended up in the main bundle. This resolves those imports
 * to lodash-es (same version) for our own source only; dependencies keep their own lodash.
 */
export const lodashEs = (sourceDirs: string[]): Plugin => {
  const dirs = sourceDirs.map((dir) => path.resolve(dir) + path.sep)
  return {
    name: 'ayon:lodash-es',
    enforce: 'pre',
    async resolveId(source, importer, options) {
      if (source !== 'lodash' || !importer) return null
      if (!dirs.some((dir) => importer.startsWith(dir))) return null
      return this.resolve('lodash-es', importer, { ...options, skipSelf: true })
    },
  }
}
