// here get and update the selected (default) view for the specific view type and project

import {
  GetDefaultViewApiResponse,
  useGetDefaultViewQuery,
  useSetDefaultViewMutation,
} from '@shared/api'

type Props = {
  viewType: string
  projectName?: string
}

type Return = [
  selectedView: GetDefaultViewApiResponse | undefined,
  setSelectedView: (viewId: string) => void,
]

export const useSelectedView = ({ viewType, projectName }: Props): Return => {
  const { data: defaultView } = useGetDefaultViewQuery(
    { viewType, projectName },
    { skip: !viewType },
  )

  const [setDefaultView] = useSetDefaultViewMutation()

  const setSelectedView = async (viewId: string) => {
    if (!viewType) throw 'No view type provided for setting default view'

    try {
      await setDefaultView({
        setDefaultViewRequestModel: {
          viewId,
        },
        viewType,
        projectName,
      }).unwrap()
    } catch (error) {
      console.error('Failed to set default view:', error)
    }
  }
  return [defaultView, setSelectedView]
}
