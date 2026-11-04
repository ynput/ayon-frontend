// a second contract package: its slot merges with the planner's
import type { Loader, MenuItemMeta, RunPiece } from '@ynput/ayon-addon'

declare module '@ynput/ayon-addon' {
  interface SlotMap {
    'review.cardMenuItem': {
      version: 1
      meta: MenuItemMeta
      context: { cardId: string }
      pieces: { run: Loader<RunPiece<'review.cardMenuItem'>> }
    }
  }
}
