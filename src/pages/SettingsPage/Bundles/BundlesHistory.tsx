// The history of the bundles, from addons (bundles.history slot, @ynput/ayon-addon): a row below
// the toolbar of the selected bundle.
import { useEffect, useMemo, useRef, useState } from 'react'
import { ContributionView, prefetchPiece, useContributions } from '@ynput/ayon-addon'
import type { BundlesHistoryContext, Contribution } from '@ynput/ayon-addon'
import { usePowerpack } from '@shared/context'

type History = Contribution<'bundles.history'>

/** The contributions to show; a power feature's only with a Power Pack licence */
export const useBundlesHistory = () => {
  const { contributions } = useContributions('bundles.history')
  const { powerLicense, isLoading } = usePowerpack()
  const available = useMemo(
    () => contributions.filter((history) => !history.powerFeature || (powerLicense && !isLoading)),
    [contributions, powerLicense, isLoading],
  )
  // loaded with the page, so they are there when a bundle shows
  useEffect(() => {
    for (const history of available) prefetchPiece(history.component)
  }, [available])
  return available
}

type ListedBundle = { name: string; isProduction?: boolean; isStaging?: boolean; isDev?: boolean }

type Props = {
  histories: History[]
  /** the bundles the list shows */
  bundles: ListedBundle[]
  /** names of the selected bundles */
  selected: string[]
  onSelect: (names: string[]) => void
}

// untagged: the history is a child of the page's section, which sizes its children (`> *`); the
// slot inspector's wrapper would come between them
export const BundlesHistory = ({ histories, bundles, selected, onSelect }: Props) => {
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

  return (
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
}
