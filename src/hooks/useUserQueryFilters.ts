import { useGetCurrentUserQuery, useSetFrontendPreferencesMutation } from '@shared/api'
import { useAppSelector } from '@state/store'
import { QueryFilter } from '@shared/containers/ProjectTreeTable/types/operations'

interface UseUserQueryFiltersProps {
  page: string
  projectName: string
}

const useUserQueryFilters = ({ page, projectName }: UseUserQueryFiltersProps) => {
  const userName = useAppSelector((state) => state.user.name)
  // GET CURRENT USER
  const { data: user } = useGetCurrentUserQuery()
  // extract out query filters config for project
  const { data: { frontendPreferences } = {} } = user || {}
  const frontendPreferencesQueryFilters: {
    [page: string]: {
      [projectName: string]: QueryFilter
    }
  } = frontendPreferences?.queryFilters || {}
  const pageQueryFilters = frontendPreferencesQueryFilters?.[page] ?? {}
  const queryFilters = pageQueryFilters[projectName] ?? { conditions: [], operator: 'and' }

  const [updateUserPreferences] = useSetFrontendPreferencesMutation()

  const setQueryFilters = (value: QueryFilter) => {
    const updatedPageQueryFilters = { ...pageQueryFilters, [projectName]: value }
    const updatedUserQueryFilters = {
      ...frontendPreferencesQueryFilters,
      [page]: updatedPageQueryFilters,
    }
    const updatedFrontendPreferences = {
      ...frontendPreferences,
      queryFilters: updatedUserQueryFilters,
    }
    updateUserPreferences({ userName, patchData: updatedFrontendPreferences })
  }

  return { queryFilters, setQueryFilters }
}

export default useUserQueryFilters
