import { VersionsSettings } from '@shared/api'
import { useViewsContext } from '@shared/containers'
import { useViewUpdateHelper } from '@shared/containers/Views/utils/viewUpdateHelper'
import {
    createContext,
    FC,
    ReactNode,
    useCallback,
    useContext,
    useMemo,
    useState,
} from 'react'

export type ReviewCardsSettingsContextValue = {
  gridHeight: number
  onUpdateGridHeight: (gridHeight: number) => void
  onUpdateGridHeightWithPersistence: (gridHeight: number) => void
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
  const settings = useMemo(() => viewSettings as VersionsSettings, [viewSettings])

  const [localGridHeight, setLocalGridHeight] = useState<number | null>(null)
  const [localGridHeightImmediate, setLocalGridHeightImmediate] = useState<number | null>(null)

  // Get view update helper
  const { updateViewSettings } = useViewUpdateHelper()

  const serverGridHeight = useMemo(
    () => settings?.gridHeight ?? 200,
    [settings?.gridHeight],
  )

  // Sync local state with server when viewSettings change
  // TODO: uncomment once views are working
  // useEffect(() => {
  //   setLocalGridHeight(null)
  //   setLocalGridHeightImmediate(null)
  // }, [JSON.stringify(viewSettings)])

  const gridHeight = useMemo(
    () =>
      localGridHeightImmediate !== null
        ? localGridHeightImmediate
        : localGridHeight !== null
        ? localGridHeight
        : serverGridHeight,
    [localGridHeightImmediate, localGridHeight, serverGridHeight],
  )

  // Grid height update handler (immediate, no API call)
  const onUpdateGridHeight = useCallback((newGridHeight: number) => {
    setLocalGridHeightImmediate(newGridHeight)
  }, [])

  // Grid height update handler with persistence (API call)
  const onUpdateGridHeightWithPersistence = useCallback(
    async (newGridHeight: number) => {
      await updateViewSettings({ gridHeight: newGridHeight }, setLocalGridHeight, newGridHeight, {
        errorMessage: 'Failed to update grid height',
      })
      // Clear immediate state after persistence
      // setLocalGridHeightImmediate(null)
    },
    [updateViewSettings],
  )

  return (
    <ReviewCardsContext.Provider
      value={{
        gridHeight,
        onUpdateGridHeight,
        onUpdateGridHeightWithPersistence,
      }}
    >
      {children}
    </ReviewCardsContext.Provider>
  )
}
