import { MANIFEST_MODULE, registerManifests, setManifestsLoading } from '@ynput/ayon-addon/host'
import type { ManifestEntry } from '@ynput/ayon-addon/host'

export type ManifestRemote = {
  remote: string
  addon: string
  version: string
  modules: string[]
}

// Addons that list a `manifest` module declare their contributions and slots in it
// (@ynput/ayon-addon). It holds descriptions only, so every manifest loads at startup; the
// contributions' code loads when their slot needs it.
// An addon can contribute to a slot another addon declares, so nothing is registered until every
// manifest has loaded, and then in the order of `remotes`: whichever resolves first doesn't matter.
// Returns the addons whose manifest failed.
export const loadManifests = async (
  remotes: ManifestRemote[],
  load: (id: string) => Promise<{ default: unknown } | null | undefined>,
) => {
  const failed: Record<string, string> = {}
  const entries = await Promise.all(
    remotes
      .filter((r) => r.modules.includes(MANIFEST_MODULE))
      .map(async (r): Promise<ManifestEntry | undefined> => {
        try {
          const manifest = await load(`${r.remote}/${MANIFEST_MODULE}`)
          const definition = manifest?.default as { contributes?: unknown } | undefined
          if (!Array.isArray(definition?.contributes)) {
            throw new Error('the manifest has no "contributes" list: export default defineAddon({ contributes })')
          }
          return {
            addon: { name: r.addon, version: r.version, remote: r.remote },
            manifest: manifest?.default,
          }
        } catch (error) {
          console.error(`[addon ${r.addon}] its manifest failed to load`, error)
          failed[r.addon] = String(error)
        }
      }),
  )
  registerManifests(entries.filter((entry): entry is ManifestEntry => !!entry))
  setManifestsLoading(false)
  return failed
}
