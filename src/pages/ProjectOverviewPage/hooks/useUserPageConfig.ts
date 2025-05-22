import { useGetCurrentUserQuery, useSetFrontendPreferencesMutation } from '@shared/api'
import { toast } from 'react-toastify'

type Props = {
  selectors?: (string | undefined | null)[]
  init?: any
}

type Result = [
  Record<string, any>,
  (config: Record<string, any>) => Promise<void>,
  { isSuccess: boolean },
]

export const useUsersPageConfig = ({ selectors = [], init }: Props): Result => {
  // GET CURRENT USER
  const { data: user, isSuccess } = useGetCurrentUserQuery()
  // extract out columns config for project
  const { data: { frontendPreferences: preferences = {} } = {} } = user || {}

  const configPath = selectors
    .filter((selector) => selector !== undefined && selector !== null)
    .map((selector) => selector.replace(/\s/g, ''))
  // Start with the root preferences
  let userConfig = preferences
  for (const selector of configPath) {
    userConfig = userConfig?.[selector]
  }

  userConfig = userConfig || init || {}

  const [updateUserPreferences] = useSetFrontendPreferencesMutation()

  // update the user preferences when the columns config changes
  const updateProjectConfig = async (config: Record<string, any>) => {
    try {
      if (!user?.name) throw { data: { detail: 'User not found' } }

      // Set the updated config at the correct nested path using only selectors
      let updatedPreferences = { ...preferences }

      // Helper function to set nested value
      const setNestedValue = (obj: any, path: string[], value: any): any => {
        if (path.length === 0) return { ...obj, ...value }

        const [first, ...rest] = path
        const nestedObj = obj?.[first] || {}

        return {
          ...obj,
          [first]: setNestedValue(nestedObj, rest, value),
        }
      }

      // Use the helper to set the value at the correct path
      updatedPreferences = setNestedValue(updatedPreferences, configPath, config)

      await updateUserPreferences({
        userName: user.name,
        patchData: updatedPreferences,
        // @ts-expect-error - disableInvalidations is not in the api
        disableInvalidations: true,
      }).unwrap()
    } catch (error: any) {
      console.error(error)
      toast.error(error.data?.detail)
    }
  }

  return [userConfig, updateProjectConfig, { isSuccess: isSuccess }]
}
