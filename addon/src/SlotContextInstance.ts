import { createContext } from 'react'
import type { AnyContribution } from './contributions'

export interface ActiveSlot {
  slot: string
  /** `{ slot, ...context }`, what useSlot returns (one object per context change) */
  value: object
  contribution: AnyContribution
}

// set by ContributionView around every piece it renders; read by useSlot
export const SlotReactContext = createContext<ActiveSlot | null>(null)
