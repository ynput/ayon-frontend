import { RemoteAddonProjectProps, usePowerpack } from "@shared/context"
import { useLoadModule } from "@shared/hooks"
import { PropsWithChildren } from "react"

function FallbackReviewCardsProvider({ }: RemoteAddonProjectProps & PropsWithChildren & {
  onSelectionChange: (versionIds: string[]) => void
  headerContentStart?: JSX.Element
  headerContentEnd?: JSX.Element
  api?: any
  gridSize?: number
}) { return <></> }

type Args = {
  skip: boolean
}

export default function useReviewSessionCards({ skip }: Args) {
  const { powerLicense } = usePowerpack()

  const commonOptions = {
    addon: 'review',
    remote: 'review',
    minVersion: '0.3.0',
    skip: !powerLicense || skip, // skip loading if powerpack license is not available
  }

  const [ReviewSessionCards, { isLoaded: reviewSessionCardsLoaded }] = useLoadModule({
    ...commonOptions,
    module: 'ReviewCards',
    fallback: () => <></>,
  })
  const [ReviewSessionCardsProvider, { isLoaded: reviewSessionCardsProviderLoaded }] = useLoadModule({
    ...commonOptions,
    module: 'ReviewCardsProvider',
    fallback: FallbackReviewCardsProvider,
  })
  const [ReviewSessionCardsControlsLeft, { isLoaded: reviewSessionCardsControlsLeftLoaded }] = useLoadModule({
    ...commonOptions,
    module: 'ReviewCardsControlsLeft',
    fallback: () => <></>,
  })
  const [ReviewSessionCardsControlsRight, { isLoaded: reviewSessionCardsControlsRightLoaded }] = useLoadModule({
    ...commonOptions,
    module: 'ReviewCardsControlsRight',
    fallback: () => <></>,
  })

  const allModulesLoaded = reviewSessionCardsLoaded
    && reviewSessionCardsProviderLoaded
    && reviewSessionCardsControlsLeftLoaded
    && reviewSessionCardsControlsRightLoaded

  return {
    ReviewSessionCards,
    ReviewSessionCardsProvider,
    ReviewSessionCardsControlsLeft,
    ReviewSessionCardsControlsRight,
    allModulesLoaded,
  }
}
