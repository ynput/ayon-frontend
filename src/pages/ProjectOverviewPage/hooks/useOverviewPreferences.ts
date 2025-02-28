import { useSetFrontendPreferencesMutation } from '@queries/user/updateUser'
import { useAppSelector } from '@state/store'
import { $Any } from '@types'
import { useEffect, useState } from 'react'

const useOverviewPreferences = () => {
  const userName = useAppSelector((state) => state.user.name)
  const [updateUserPreferences] = useSetFrontendPreferencesMutation()
  const [showHierarchy, setShowHierarchy] = useState<boolean>(true)

  const updateShowHierarchy = (newValue: boolean) => {
    // @ts-ignore
    const overviewSettings = frontendPreferences?.pageSettings?.overview || {}
    const updatedFrontendPreferences = {
      ...frontendPreferences,
      pageSettings: {
        ...frontendPreferences.pageSettings,
        overview: {
          ...overviewSettings,
          showHierarchy: newValue,
        },
      },
    }

    updateUserPreferences({ userName, patchData: updatedFrontendPreferences })
  }

  const frontendPreferences = useAppSelector((state) => state.user.data.frontendPreferences)
  const overviewPageSettings: { showHierarchy: boolean } = (
    frontendPreferences?.pageSettings as { [key: string]: $Any }
  )?.overview || { showHierarchy: false }

  overviewPageSettings.showHierarchy
  useEffect(() => {
    setShowHierarchy(overviewPageSettings.showHierarchy)
  }, [overviewPageSettings.showHierarchy])

  return {
    showHierarchy,
    updateShowHierarchy,
  }
}

export default useOverviewPreferences
