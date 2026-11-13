// `ayon-addon open | preview` (browse.ts): where playwright may be, which menu to open for a menu
// slot, and whether the contribution counts as shown from what the dev shell reports about its
// pieces (shell/src/tracking.ts). Kept apart from browse.ts so it loads without a browser.
import { existsSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

/**
 * Where playwright may be installed, in order: the addon, next to this package (addon-dev linked
 * from an ayon-frontend checkout), and in the AYON dev workbench the ayon-frontend checkout
 * (`repos/ayon-frontend`), which has it for its own tests. From npm, addon-dev sits in the addon's
 * node_modules, so "next to this package" is the addon again: the workbench is what finds one.
 * `self` is addon-dev's own file URL.
 */
export const playwrightLocations = (root: string, self: string): string[] => {
  const locations = [path.join(root, 'package.json'), fileURLToPath(self)]
  let dir = path.resolve(root)
  while (dir !== path.dirname(dir)) {
    const frontend = path.join(dir, 'repos', 'ayon-frontend')
    if (
      existsSync(path.join(dir, 'mani.yaml')) &&
      existsSync(path.join(frontend, 'package.json'))
    ) {
      locations.push(path.join(frontend, 'package.json'))
      break
    }
    dir = path.dirname(dir)
  }
  return locations
}

/**
 * The button that opens the menu with a menu slot's items (`data-ayon-trigger`, AYON's slot
 * inspector marks them), or, for the table's right-click menu, a cell to right-click. `open`
 * opens it, so the screenshot shows the items.
 */
export const menuOpener = (
  slot: string,
): { selector: string; button: 'left' | 'right' } | undefined => {
  if (slot === 'entityMenuItem')
    return { selector: '[data-shell-surface="table"] td', button: 'right' }
  const triggers = [
    'detailsPanel.menuItem',
    'projectList.menuItem',
    'slicer.menuItem',
    'userDetails.menuItem',
    'projectTable.columnMenuItem',
  ]
  return triggers.includes(slot)
    ? { selector: `[data-ayon-trigger="${slot}"]`, button: 'left' }
    : undefined
}

/** What the shell reports about the selected contribution's pieces (shell/src/tracking.ts). */
export interface PieceStatus {
  found: boolean
  tracked: string[]
  mounted: Record<string, number>
  everMounted: string[]
  runs: number
}

/** The piece that must be mounted for the contribution to count as shown, if any. */
export const expectedPiece = (tracked: readonly string[]) =>
  tracked.includes('component') ? 'component' : tracked.includes('cell') ? 'cell' : undefined

/**
 * Why the contribution didn't render (or, with --run, didn't run), from what its pieces reported:
 * a slot on stage with a context is not enough (a tab that is never picked stays a button).
 */
export const pieceProblems = (
  slot: string,
  id: string,
  pieces: PieceStatus,
  run?: boolean,
): string[] => {
  if (!pieces.found) return [`the addon's manifest has no contribution "${id}" to ${slot}`]
  const problems: string[] = []
  const piece = expectedPiece(pieces.tracked)
  if (piece && !pieces.mounted[piece]) {
    const what =
      piece === 'cell' ? 'no cell of the column is rendered' : 'its component is not rendered'
    const why = pieces.everMounted.includes(piece)
      ? 'it mounted, then unmounted again'
      : piece === 'cell'
      ? 'are there rows (--entities) of its entityTypes, on one of its pages (--page)?'
      : 'it never mounted: does it apply to this context (entityTypes, pages, --entities, --project)?'
    problems.push(`${what}: ${why}`)
  }
  if (run && pieces.tracked.includes('run') && !pieces.runs)
    problems.push('--run: its run piece was not called')
  return problems
}
