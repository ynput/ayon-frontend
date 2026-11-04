// what a contract package's types do
import type { EntityRef, Loader, MenuItemMeta, RunPiece } from '@ynput/ayon-addon'

declare module '@ynput/ayon-addon' {
  interface SlotMap {
    'planner.eventMenuItem': {
      version: 1
      meta: MenuItemMeta
      context: { projectName: string; entities: EntityRef[] }
      pieces: { run: Loader<RunPiece<'planner.eventMenuItem'>> }
    }
  }
}
