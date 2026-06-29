import { UserModel, useSetFrontendPreferencesMutation } from '@shared/api'
import { toast } from 'react-toastify'

export type BundleMode = 'production' | 'staging' | 'developer'

export const getBundleModeFromUser = (user: UserModel | undefined): BundleMode => {
  if (user?.attrib?.developerMode) return 'developer'
  if (user?.data?.frontendPreferences?.stagingMode) return 'staging'
  return 'production'
}

export const useStagingModeState = (user: UserModel, onChange?: (newPrefs: any) => void) => {
  const [updatePreferences] = useSetFrontendPreferencesMutation()

  const stagingMode = user?.data?.frontendPreferences?.stagingMode ?? false

  const setStagingMode = async (enabled: boolean) => {
    try {
      const newPreferences = {
        ...(user?.data?.frontendPreferences || {}),
        stagingMode: enabled,
      }
      // update user
      updatePreferences({
        userName: user.name,
        patchData: newPreferences,
      }).unwrap()

      if (onChange) {
        onChange(newPreferences)
      }
    } catch (error) {
      console.error(error)
      toast.error('Failed to update staging mode')
    }
  }

  return [stagingMode, setStagingMode] as const
}
