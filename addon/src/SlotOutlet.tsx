import { useCallback } from 'react'
import type { ReactNode } from 'react'
import { ContributionView } from './ContributionView'
import type { AnyContribution, Contribution } from './contributions'
import { getHost } from './hostBridge'
import { menuItemsAt } from './menus'
import { prefetchPiece, runContribution } from './pieces'
import { contributionTags, isExample, useContributions } from './registry'
import type { Loader, MenuItemPosition, SlotMap, SlotName } from './slots'

export interface SlotOutletProps<S extends SlotName> {
  slot: S
  /** the slot's context; memoize it, the components re-render when it changes */
  context: SlotMap[S]['context']
  /** which piece to render, `component` by default */
  piece?: string
  /** shown while a piece loads */
  loading?: ReactNode
  /** replaces the default error box of a contribution that fails */
  error?: (error: Error) => ReactNode
}

const noReport = () => undefined

/**
 * Renders every contribution to a slot, for an addon that declares its own slots (and any other
 * surface). Each is a `ContributionView`: lazy, and a crash stays in its own error box.
 */
export const SlotOutlet = <S extends SlotName>({ slot, context, piece, loading, error }: SlotOutletProps<S>) => {
  const { contributions } = useContributions(slot)
  // the dev shell's Context panel shows what the slot passes; AYON has no such hook
  const useOutletReport = getHost().devSlots?.useOutletReport ?? noReport
  useOutletReport(slot, context)
  return (
    <>
      {contributions.map((contribution) => (
        <ContributionView
          key={(contribution as unknown as AnyContribution).key}
          contribution={contribution}
          context={context}
          piece={piece}
          loading={loading}
          error={error}
        />
      ))}
    </>
  )
}

/** A contribution as an entry of a menu: the fields menus take, and what a click does. */
export interface SlotMenuItem {
  id: string
  label: string
  icon: string
  command: () => void
  /** the slot inspector's tags (`data-ayon-addon`, ...), while it is on: pass them to the entry's element */
  [attribute: `data-${string}`]: string | undefined
}

export type SlotMenuItems = Record<MenuItemPosition, SlotMenuItem[]>

/**
 * For a slot of menu items (with the `MenuItemMeta` fields and a `run` piece): returns a function
 * that builds the entries when a menu opens, for the context it opens with. It starts loading their
 * code, and a broken item is a toast, never a broken menu. `top` goes first in the menu, `bottom`
 * after its own items and above the destructive ones. `applies` leaves out the contributions that
 * don't apply to this context, for a slot whose description lets a contribution narrow its scope.
 */
export const useSlotMenuItems = <S extends SlotName>(slot: S) => {
  const { contributions } = useContributions(slot)
  return useCallback(
    (context: SlotMap[S]['context'], applies?: (item: Contribution<S>) => boolean): SlotMenuItems => {
      // a slot's example shows wherever the slot does
      const items = (
        applies ? contributions.filter((item) => isExample(item) || applies(item)) : contributions
      ) as unknown as (AnyContribution & {
        label: string
        icon: string
        position?: MenuItemPosition
      })[]
      const at = (position: MenuItemPosition) =>
        menuItemsAt(items, position).map((item) => {
          prefetchPiece(item.run as Loader<unknown>)
          return {
            id: item.key,
            label: item.label,
            icon: item.icon,
            command: () => void runContribution(item as unknown as Contribution<S>, context),
            ...contributionTags(item),
          }
        })
      // the dev shell's Context panel shows the context the menu was built for
      getHost().devSlots?.menuBuilt?.(slot, context, items.map((item) => item.key))
      return { top: at('top'), bottom: at('bottom') }
    },
    [contributions, slot],
  )
}
