import { RemoteAddonProjectProps, usePowerpack } from "@shared/context"
import { useLoadModule } from "@shared/hooks"
import { createContext, PropsWithChildren, useContext } from "react"

function FallbackReviewCardsProvider({ children }: RemoteAddonProjectProps & PropsWithChildren & {
  onSelectionChange: (versionIds: string[]) => void
  onOpenDetails: (versionId: string) => void
  onOpenInViewer?: (state: {
    versionId: string
    productId: string
    folderId: string
    taskId?: string
  }) => void
  headerContentStart?: JSX.Element
  headerContentEnd?: JSX.Element
  api?: any
  gridSize?: number
}) { return <>{children}</> }

function FallbackReviewCardsControlsRight({ }: {
  groupingDisabled?: boolean
}) { return <></> }

type UseReviewSessionCardsReturn = {
  clearHighlighted?: () => void
}

const fallbackReviewSessionCardsContext = createContext({})

function fallbackUseReviewSessionCards(): UseReviewSessionCardsReturn {
  return useContext(fallbackReviewSessionCardsContext)
}

type Args = {
  skip: boolean
}

export default function useReviewSessionCardsModules({ skip }: Args) {
  const { powerLicense } = usePowerpack()

  const commonOptions = {
    addon: 'review',
    remote: 'review',
    minVersion: '0.3.0',
    skip: !powerLicense || skip, // skip loading if powerpack license is not available
  }

  const [ReviewSessionCards, { isLoaded: reviewSessionCardsLoaded, outdated }] = useLoadModule({
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
    fallback: FallbackReviewCardsControlsRight,
  })
  const [useReviewSessionCards, { isLoaded: useReviewSessionCardsLoaded }] = useLoadModule({
    ...commonOptions,
    module: 'useReviewSessionCards',
    fallback: fallbackUseReviewSessionCards,
  })

  const allModulesLoaded = reviewSessionCardsLoaded
    && reviewSessionCardsProviderLoaded
    && reviewSessionCardsControlsLeftLoaded
    && reviewSessionCardsControlsRightLoaded
    && useReviewSessionCardsLoaded

  return {
    ReviewSessionCards,
    ReviewSessionCardsProvider,
    ReviewSessionCardsControlsLeft,
    ReviewSessionCardsControlsRight,
    useReviewSessionCards,
    allModulesLoaded,
    outdated,
  }
}
