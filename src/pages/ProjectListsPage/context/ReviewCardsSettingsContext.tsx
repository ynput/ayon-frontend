import { ReviewsSettings } from '@shared/api'
import { useViewsContext } from '@shared/containers'
import { useViewUpdateHelper } from '@shared/containers/Views/utils/viewUpdateHelper'
import {
    createContext,
    FC,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react'

export type ReviewCardsSettingsContextValue = {
  gridHeight: number
  onUpdateGridHeight: (gridHeight: number) => void
  onUpdateGridHeightWithPersistence: (gridHeight: number) => void
  displayStyle: ReviewsSettings['displayStyle']
  onUpdateDisplayStyle: (displayStyle: ReviewsSettings['displayStyle']) => void
  onUpdateDisplayStyleWithPersistence: (displayStyle: ReviewsSettings['displayStyle']) => void
}

const ReviewCardsContext = createContext<ReviewCardsSettingsContextValue | null>(null)

export const useReviewCardsSettingsContext = () => {
  const context = useContext(ReviewCardsContext)
  if (!context) {
    throw new Error('useReviewCardsSettingsContext must be used within ReviewCardsSettingsProvider')
  }
  return context
}

interface ReviewCardsSettingsProviderProps {
  children: ReactNode
}

export const ReviewCardsSettingsProvider: FC<ReviewCardsSettingsProviderProps> = ({ children }) => {
  // this views context is per page/project
  const { viewSettings } = useViewsContext()

  // Memoize versionsSettings to prevent unnecessary re-renders when viewSettings
  // reference changes but values are the same
  const settings = useMemo(() => viewSettings as ReviewsSettings, [viewSettings])

  const [localGridHeight, setLocalGridHeight] = useState<number | null>(null)
  const [localGridHeightImmediate, setLocalGridHeightImmediate] = useState<number | null>(null)
  const [localDisplayStyle, setLocalDisplayStyle] = useState<ReviewsSettings['displayStyle']>()
  const [localDisplayStyleImmediate, setLocalDisplayStyleImmediate] = useState<ReviewsSettings['displayStyle']>()

  // Get view update helper
  const { updateViewSettings } = useViewUpdateHelper()

  const serverGridHeight = useMemo(
    () => settings?.gridHeight ?? 200,
    [settings?.gridHeight],
  )

  const serverDisplayStyle = useMemo(
    () => settings?.displayStyle ?? "cards",
    [settings?.displayStyle],
  )

  // Sync local state with server when viewSettings change
  useEffect(() => {
    setLocalGridHeight(null)
    setLocalGridHeightImmediate(null)
    setLocalDisplayStyle(undefined)
    setLocalDisplayStyleImmediate(undefined)
  }, [JSON.stringify(viewSettings)])

  const gridHeight = useMemo(
    () =>
      localGridHeightImmediate !== null
        ? localGridHeightImmediate
        : localGridHeight !== null
        ? localGridHeight
        : serverGridHeight,
    [localGridHeightImmediate, localGridHeight, serverGridHeight],
  )
  const displayStyle = useMemo(
    () => localDisplayStyleImmediate ?? localDisplayStyle ?? serverDisplayStyle,
    [localDisplayStyleImmediate, localDisplayStyle, serverDisplayStyle],
  )

  // Grid height update handler (immediate, no API call)
  const onUpdateGridHeight = useCallback((newGridHeight: number) => {
    setLocalGridHeightImmediate(newGridHeight)
  }, [])

  // Display style update handler (immediate, no API call)
  const onUpdateDisplayStyle = useCallback((newDisplayStyle: ReviewsSettings['displayStyle']) => {
    setLocalDisplayStyleImmediate(newDisplayStyle)
  }, [])

  // Grid height update handler with persistence (API call)
  const onUpdateGridHeightWithPersistence = useCallback(
    async (newGridHeight: number) => {
      await updateViewSettings({ gridHeight: newGridHeight }, setLocalGridHeight, newGridHeight, {
        errorMessage: 'Failed to update grid height',
      })
      // Clear immediate state after persistence
      setLocalGridHeightImmediate(null)
    },
    [updateViewSettings],
  )

  // Display style update handler with persistence (API call)
  const onUpdateDisplayStyleWithPersistence = useCallback(
    async (newDisplayStyle: ReviewsSettings['displayStyle']) => {
      await updateViewSettings({ displayStyle: newDisplayStyle }, setLocalDisplayStyle, newDisplayStyle, {
        errorMessage: 'Failed to update display style',
      })
      // Clear immediate state after persistence
      setLocalDisplayStyleImmediate(undefined)
    },
    [updateViewSettings],
  )

  return (
    <ReviewCardsContext.Provider
      value={{
        gridHeight,
        onUpdateGridHeight,
        onUpdateGridHeightWithPersistence,
        displayStyle,
        onUpdateDisplayStyle,
        onUpdateDisplayStyleWithPersistence,
      }}
    >
      {children}
    </ReviewCardsContext.Provider>
  )
}
