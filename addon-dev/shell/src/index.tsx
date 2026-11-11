// @ynput/ayon-addon-dev/shell: the standalone dev shell, started by the virtual entry
// `ayon-addon dev` serves (vite.ts). Not for addon code.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerManifest, registerManifests, setManifestsLoading } from '@ynput/ayon-addon/host'
import { buildContract, contractManifests, setContracts } from './contractModel'
import type { ContractModule } from './contractModel'
import { provideShellHost } from './host'
import { installNetwork, setFixture } from './network'
import { readSelection, writeSelection } from './params'
import { Shell } from './Shell'
import { setShowSlots } from './slotOverlay'
import type { Fixture, ShellOptions } from './types'
import './shell.css'

export type { Fixture, ShellOptions, ShellSelection, ShellStatus } from './types'

/** Where `ayon-addon dev` serves the fixtures (dev/fixtures/<name>.json). */
export const FIXTURES_PATH = '/__ayon-addon/fixtures'

const loadFixture = async (name: string): Promise<Fixture | undefined> => {
  const response = await fetch(`${FIXTURES_PATH}/${encodeURIComponent(name)}`)
  if (!response.ok) return undefined
  const fixture = (await response.json()) as Fixture
  fixture.responses ??= {}
  // the fixture's user, else an admin (network.ts)
  if (fixture.user) fixture.responses['GET /api/users/me'] ??= { status: 200, body: fixture.user }
  return fixture
}

const message = (error: unknown) => (error instanceof Error ? error.message : String(error))

// the declarations and previews of the contract packages (the dev server imports them)
const loadContracts = (modules: ContractModule[] = []) =>
  Promise.all(
    modules.map(async (module) => {
      const loaded: Parameters<typeof buildContract>[1] = {}
      await module
        .slots()
        .then((m) => (loaded.slots = m.slots))
        .catch((error) => (loaded.slotsError = message(error)))
      await module
        .previews?.()
        .then((m) => (loaded.previews = m.previews))
        .catch((error) => (loaded.previewsError = message(error)))
      return buildContract(module, loaded)
    }),
  )

export const startShell = async (options: ShellOptions) => {
  const { preview, showSlots } = readSelection()
  setShowSlots(showSlots !== false)
  const mode = preview ? 'preview' : 'live'
  installNetwork(mode)
  provideShellHost()
  // the slots of other addons, as if those addons were installed: contributions to them register
  const contracts = await loadContracts(options.contracts)
  setContracts(contracts)
  registerManifests(contractManifests(contracts, options.addon.name) as never)
  registerManifest(options.addon, options.manifest)
  setManifestsLoading(false)

  if (preview) {
    const fixture = await loadFixture(preview)
    setFixture(fixture)
    if (fixture) {
      // what the fixture is about, in the URL like a live selection
      const context = fixture.context as { projectName?: string; entities?: never[]; page?: never }
      writeSelection({
        preview,
        slot: fixture.slot,
        id: fixture.id,
        projectName: context.projectName,
        entities: context.entities || [],
        page: context.page,
      })
    }
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <Shell options={options} mode={mode} />
    </StrictMode>,
  )
}
