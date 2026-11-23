// The history of the bundles, from addons (bundles.history slot, @ynput/ayon-addon): a row below
// the toolbar of the selected bundle.
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { ContributionView, prefetchPiece, useContributions } from '@ynput/ayon-addon'
import type { BundlesHistoryContext, Contribution } from '@ynput/ayon-addon'
import { usePowerpack } from '@shared/context'

type History = Contribution<'bundles.history'>

type ListedBundle = { name: string; isProduction?: boolean; isStaging?: boolean; isDev?: boolean }

/**
 * The contributions to show, a power feature's only with a Power Pack licence, and their context:
 * `bundles` the list shows, the `selected` bundle names, and `onSelect` to select bundles.
 */
export const useBundlesHistory = (
  bundles: ListedBundle[],
  selected: string[],
  onSelect: (names: string[]) => void,
) => {
  const { contributions } = useContributions('bundles.history')
  const { powerLicense, isLoading } = usePowerpack()
  const histories = useMemo(
    () => contributions.filter((history) => !history.powerFeature || (powerLicense && !isLoading)),
    [contributions, powerLicense, isLoading],
  )
  // loaded with the page, so they are there when a bundle shows
  useEffect(() => {
    for (const history of histories) prefetchPiece(history.component)
  }, [histories])

  // selectBundle never changes and calls the latest onSelect
  const select = useRef(onSelect)
  select.current = onSelect
  const [selectBundle] = useState(() => (name: string) => select.current([name]))

  const listed = useMemo(
    () =>
      bundles.map(({ name, isProduction, isStaging, isDev }) => ({
        name,
        isProduction: !!isProduction,
        isStaging: !!isStaging,
        isDev: !!isDev,
      })),
    [bundles],
  )
  const context = useMemo<BundlesHistoryContext>(
    () => ({ bundles: listed, selected, selectBundle }),
    [listed, selected, selectBundle],
  )
  return { histories, context }
}

type Props = {
  histories: History[]
  /** memoized: the pieces re-render when it changes */
  context: BundlesHistoryContext
}

// untagged: the history is a child of the page's section, which sizes its children (`> *`); the
// slot inspector's wrapper would come between them. Memoized: the page re-renders often
const HistoryPieces = ({ histories, context }: Props) => (
  <>
    {histories.map((history) => (
      <ContributionView
        key={history.key}
        contribution={history}
        context={context}
        piece="component"
        untagged
      />
    ))}
  </>
)

export const BundlesHistory = memo(HistoryPieces)
