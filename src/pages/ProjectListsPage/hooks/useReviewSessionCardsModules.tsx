import { usePowerpack } from '@shared/context'
import { useLoadModule } from '@shared/hooks'
import { createContext, useContext } from 'react'
import {
  FallbackReviewCardsControlsRight,
  FallbackReviewCardsProvider,
} from './ReviewSessionCardsFallbacks'

export type Clip = { listItemId: string }
export type UpdateType = 'reorder' | 'add' | 'delete' | 'replace' | 'update'

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
  const [ReviewSessionCardsProvider, { isLoaded: reviewSessionCardsProviderLoaded }] =
    useLoadModule({
      ...commonOptions,
      module: 'ReviewCardsProvider',
      fallback: FallbackReviewCardsProvider,
    })
  const [ReviewSessionCardsControlsLeft, { isLoaded: reviewSessionCardsControlsLeftLoaded }] =
    useLoadModule({
      ...commonOptions,
      module: 'ReviewCardsControlsLeft',
      fallback: () => <></>,
    })
  const [ReviewSessionCardsControlsRight, { isLoaded: reviewSessionCardsControlsRightLoaded }] =
    useLoadModule({
      ...commonOptions,
      module: 'ReviewCardsControlsRight',
      fallback: FallbackReviewCardsControlsRight,
    })
  const [useReviewSessionCards, { isLoaded: useReviewSessionCardsLoaded }] = useLoadModule({
    ...commonOptions,
    module: 'useReviewSessionCards',
    fallback: fallbackUseReviewSessionCards,
  })

  const allModulesLoaded =
    reviewSessionCardsLoaded &&
    reviewSessionCardsProviderLoaded &&
    reviewSessionCardsControlsLeftLoaded &&
    reviewSessionCardsControlsRightLoaded &&
    useReviewSessionCardsLoaded

  return {
    ReviewSessionCards,
    ReviewSessionCardsProvider,
    ReviewSessionCardsControlsLeft,
    ReviewSessionCardsControlsRight,
    // the addon's hook needs its provider's context: use it only once the provider has loaded
    useReviewSessionCards: reviewSessionCardsProviderLoaded
      ? useReviewSessionCards
      : fallbackUseReviewSessionCards,
    allModulesLoaded,
    outdated,
  }
}
