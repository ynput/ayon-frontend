import { useLoadModule } from '@shared/hooks/useLoadModule'
import type { PlayerPlugins } from '@ynput/ayon-player/plugins'

/**
 * What the Review addon's `ViewerPlayerPlugins` module returns: the player plugins it
 * contributes to the viewer (comparison, the timeline and annotations), or null when its
 * licence doesn't cover them. `isLoading` stays true until the licence is known.
 */
export type ViewerPlayerPluginsResult = { isLoading: boolean; plugins: PlayerPlugins | null }
export type UseViewerPlayerPlugins = () => ViewerPlayerPluginsResult

const useNoPlugins: UseViewerPlayerPlugins = () => ({ isLoading: false, plugins: null })

// the first Review version that exposes ViewerPlayerPlugins
const REVIEW_MIN_VERSION = '1.0.12'

/**
 * Loads Review's player plugins hook. Returns the fallback (no plugins) when Review is not
 * installed or too old. The player calls plugin hooks conditionally, so its plugin set must not
 * change once it is mounted: wait for `isLoading` to be false, then call the hook.
 */
const useViewerPlayerPlugins = () =>
  useLoadModule<UseViewerPlayerPlugins>({
    addon: 'review',
    remote: 'review',
    module: 'ViewerPlayerPlugins',
    fallback: useNoPlugins,
    minVersion: REVIEW_MIN_VERSION,
  })

export default useViewerPlayerPlugins
