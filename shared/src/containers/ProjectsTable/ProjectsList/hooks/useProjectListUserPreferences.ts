import { useSetFrontendPreferencesMutation } from '@shared/api'
import { useGlobalContext } from '@shared/context'
import { RowPinningState } from '@tanstack/react-table'

const useProjectListUserPreferences = () => {
  const { user } = useGlobalContext()
  const { data: { frontendPreferences: preferences = {} } = {} } = user || {}
  const rowPinning: RowPinningState['top'] = preferences?.pinnedProjects || []

  const [updateUserPreferences] = useSetFrontendPreferencesMutation()

  const onRowPinningChange = async (pinning: RowPinningState) => {
    if (!user?.name) return
    await updateUserPreferences({
      userName: user.name,
      patchData: { pinnedProjects: pinning.top },
    }).unwrap()
  }

  return { rowPinning, onRowPinningChange, user }
}

export default useProjectListUserPreferences
