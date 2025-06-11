import { Filter } from '@ynput/ayon-react-components'
import { useGetCurrentUserQuery, useSetFrontendPreferencesMutation } from '@shared/api'
import { useAppSelector } from '@state/store'

interface UseUserFiltersProps {
  page: string
  projectName: string
}

const useUserFilters = ({ page, projectName }: UseUserFiltersProps) => {
  const userName = useAppSelector((state) => state.user.name)
  // GET CURRENT USER
  const { data: user } = useGetCurrentUserQuery()
  // extract out columns config for project
  const { data: { frontendPreferences } = {} } = user || {}
  const frontendPreferencesFilters: {
    [page: string]: {
      [projectName: string]: Filter[]
    }
  } = frontendPreferences?.filters
  const pageFilters = frontendPreferencesFilters?.[page] ?? {}
  const filters = pageFilters[projectName] ?? []

  const [updateUserPreferences] = useSetFrontendPreferencesMutation()

  const setFilters = (value: Filter[]) => {
    const updatedPageFilters = { ...pageFilters, [projectName]: value }
    const updatedUserFilters = { ...frontendPreferencesFilters, [page]: updatedPageFilters }
    const updatedFrontendPreferences = { ...frontendPreferences, filters: updatedUserFilters }
    updateUserPreferences({ userName, patchData: updatedFrontendPreferences })
  }

  return { filters, setFilters }
}

export default useUserFilters
