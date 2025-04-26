import { useGetCurrentUserQuery } from '@queries/auth/getAuth'
import { useSetFrontendPreferencesMutation } from '@queries/user/updateUser'
import { toast } from 'react-toastify'

type Props = {
  projectName: string
  page: string
}

type Result = [
  Record<string, any>,
  (config: Record<string, any>) => Promise<void>,
  { isSuccess: boolean },
]

export const useUsersPageConfig = ({ projectName, page }: Props): Result => {
  // GET CURRENT USER
  const { data: user, isSuccess } = useGetCurrentUserQuery()
  // extract out columns config for project
  const { data: { frontendPreferences: preferences = {} } = {} } = user || {}
  // frontendPreferences[page][projectName]
  const pageConfig = preferences?.[page] || {}
  const pageProjectConfig = pageConfig?.[projectName] || {}

  const [updateUserPreferences] = useSetFrontendPreferencesMutation()

  // update the user preferences when the columns config changes
  const updateProjectConfig = async (config: Record<string, any>) => {
    try {
      if (!user?.name) throw { data: { detail: 'User not found' } }
      const updatedPageProjectConfig = { ...pageProjectConfig, ...config }
      const updatedPageConfig = { ...pageConfig, [projectName]: updatedPageProjectConfig }
      const updatedPreferences = { ...preferences, [page]: updatedPageConfig }
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

  return [pageProjectConfig, updateProjectConfig, { isSuccess: isSuccess }]
}
