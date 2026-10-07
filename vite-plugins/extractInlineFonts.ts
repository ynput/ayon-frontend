import { createHash } from 'crypto'
import fs from 'fs'
import path from 'path'
import type { Plugin } from 'vite'

/**
 * @ynput/ayon-react-components/dist/style.css inlines the Material Symbols icon font as a ~4 MB
 * base64 data URL. That stylesheet is render blocking, so nothing (not even the loading screen)
 * could paint until all of it was downloaded and parsed, and the font could not be cached on
 * its own. This writes each inlined font to a file and points the CSS at it, so Vite emits it
 * as a normal hashed asset that the browser fetches only when an icon is rendered.
 */
export const extractInlineFonts = (cssFile: RegExp): Plugin => {
  const cacheDir = path.resolve('node_modules/.cache/extracted-fonts')

  return {
    name: 'ayon:extract-inline-fonts',
    enforce: 'pre',
    transform(code, id) {
      const [file] = id.split('?')
      if (!cssFile.test(file)) return null

      const out = code.replace(
        /url\(\s*['"]?data:font\/(woff2?|ttf|otf);base64,([A-Za-z0-9+/=]+)['"]?\s*\)/g,
        (_, ext: string, base64: string) => {
          const data = Buffer.from(base64, 'base64')
          const hash = createHash('sha256').update(data).digest('hex').slice(0, 12)
          const fontFile = path.join(cacheDir, `font-${hash}.${ext}`)
          if (!fs.existsSync(fontFile)) {
            fs.mkdirSync(cacheDir, { recursive: true })
            fs.writeFileSync(fontFile, data)
          }
          // relative to the css file, so vite's css url handling resolves and emits it
          return `url("${path.relative(path.dirname(file), fontFile).split(path.sep).join('/')}")`
        },
      )

      return out === code ? null : { code: out, map: null }
    },
  }
}
