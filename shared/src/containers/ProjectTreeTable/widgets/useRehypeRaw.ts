import { useEffect, useState } from 'react'
import type { Options } from 'react-markdown'

type RehypePlugin = NonNullable<Options['rehypePlugins']>[number]

// rehype-raw (HTML inside markdown) pulls in parse5 (~270 KB), so it's loaded with the first
// markdown cell instead of with the main bundle. Until then raw HTML in those cells isn't rendered.
let rehypeRaw: RehypePlugin | undefined
let request: Promise<RehypePlugin> | undefined
const loadRehypeRaw = () =>
  (request ??= import('rehype-raw').then((module) => (rehypeRaw = module.default)))

export const useRehypeRaw = (enabled: boolean) => {
  // the plugin is a function, so it's wrapped to keep useState from calling it
  const [plugin, setPlugin] = useState(() => rehypeRaw)

  useEffect(() => {
    if (!enabled || plugin) return
    let active = true
    loadRehypeRaw().then((loaded) => {
      if (active) setPlugin(() => loaded)
    })
    return () => {
      active = false
    }
  }, [enabled, plugin])

  return plugin
}
