import { usePowerpack } from '@shared/context'
import { useLoadModule } from '@shared/hooks'
import { ComponentType, createContext, PropsWithChildren, useContext, useMemo } from 'react'
import { ReactReduxContext } from 'react-redux'
import { AddonStore, HostStore } from './ReviewAddonStore'
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

const withHostStoreForChildren = <P extends PropsWithChildren>(Provider: ComponentType<P>) =>
  function ReviewCardsProvider({ children, ...props }: P) {
    const host = useContext(ReactReduxContext)
    return (
      <Provider {...(props as P)}>
        <HostStore host={host}>{children}</HostStore>
      </Provider>
    )
  }

const withAddonStore = <P extends object>(Component: ComponentType<P>) =>
  function AddonComponent(props: P) {
    return (
      <AddonStore>
        <Component {...props} />
      </AddonStore>
    )
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

  // see ReviewAddonStore: host children of the provider use the host store, the addon's components its own
  const ReviewSessionCardsProviderWithHostStore = useMemo(
    () => withHostStoreForChildren(ReviewSessionCardsProvider),
    [ReviewSessionCardsProvider],
  )
  const ReviewSessionCardsWithAddonStore = useMemo(
    () => withAddonStore(ReviewSessionCards),
    [ReviewSessionCards],
  )
  const ReviewSessionCardsControlsLeftWithAddonStore = useMemo(
    () => withAddonStore(ReviewSessionCardsControlsLeft),
    [ReviewSessionCardsControlsLeft],
  )
  const ReviewSessionCardsControlsRightWithAddonStore = useMemo(
    () => withAddonStore(ReviewSessionCardsControlsRight),
    [ReviewSessionCardsControlsRight],
  )

  return {
    ReviewSessionCards: ReviewSessionCardsWithAddonStore,
    ReviewSessionCardsProvider: ReviewSessionCardsProviderWithHostStore,
    ReviewSessionCardsControlsLeft: ReviewSessionCardsControlsLeftWithAddonStore,
    ReviewSessionCardsControlsRight: ReviewSessionCardsControlsRightWithAddonStore,
    // the addon's hook needs its provider's context: use it only once the provider has loaded
    useReviewSessionCards: reviewSessionCardsProviderLoaded
      ? useReviewSessionCards
      : fallbackUseReviewSessionCards,
    allModulesLoaded,
    outdated,
  }
}
