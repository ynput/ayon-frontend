// The history of the settings in the editor, from addons (addonSettings.history slot,
// @ynput/ayon-addon): a timeline above the settings and a sidebar beside them.
import { memo, useEffect, useMemo } from 'react'
import { ContributionView, prefetchPiece, useContributions } from '@ynput/ayon-addon'
import type { AddonSettingsHistoryContext, Contribution } from '@ynput/ayon-addon'
import { usePowerpack } from '@shared/context'

type History = Contribution<'addonSettings.history'>

const NONE: History[] = []

/**
 * The contributions to show once the editor shows an addon; a power feature's only with a Power
 * Pack licence. Site settings have no history.
 */
export const useAddonSettingsHistory = (siteSettings: boolean, hasAddons: boolean) => {
  const { contributions } = useContributions('addonSettings.history')
  const { powerLicense, isLoading } = usePowerpack()
  const available = useMemo(
    () =>
      siteSettings
        ? NONE
        : contributions.filter((history) => !history.powerFeature || (powerLicense && !isLoading)),
    [siteSettings, contributions, powerLicense, isLoading],
  )
  // loaded with the page, so they are there when an addon is selected
  useEffect(() => {
    for (const history of available) {
      prefetchPiece(history.timeline)
      prefetchPiece(history.sidebar)
    }
  }, [available])
  return hasAddons ? available : NONE
}

type Props = {
  histories: History[]
  piece: 'timeline' | 'sidebar'
  /** memoized: the pieces re-render when it changes */
  context: AddonSettingsHistoryContext
}

// untagged: the pieces are children of the editor's sections, which size their children (`> *`);
// the slot inspector's wrapper would come between them. Memoized: the editor re-renders on every edit
const HistoryPieces = ({ histories, piece, context }: Props) => (
  <>
    {histories.map((history) => (
      <ContributionView
        key={history.key}
        contribution={history}
        context={context}
        piece={piece}
        untagged
      />
    ))}
  </>
)

export const AddonSettingsHistory = memo(HistoryPieces)
