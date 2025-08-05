// here get and update the selected (default) view for the specific view type and project

import {
  GetDefaultViewApiResponse,
  useGetDefaultViewQuery,
  useSetDefaultViewMutation,
} from '@shared/api'
import { toast } from 'react-toastify'
import { useRef } from 'react'

type Props = {
  viewType: string
  projectName?: string
}

type Return = [
  selectedView: GetDefaultViewApiResponse | undefined,
  setSelectedView: (viewId: string) => void,
  previousSelectedViewId: string | undefined,
]

export const useSelectedView = ({ viewType, projectName }: Props): Return => {
  const { currentData: defaultView } = useGetDefaultViewQuery(
    { viewType, projectName },
    { skip: !viewType },
  )

  const [setDefaultView] = useSetDefaultViewMutation()

  // Store the previous selected view ID
  const previousSelectedViewId = useRef<string | undefined>(undefined)

  const setSelectedView = async (viewId: string) => {
    if (!viewType) throw 'No view type provided for setting default view'

    // Store the current view ID as previous before setting the new one
    if (defaultView?.id && defaultView.id !== viewId) {
      previousSelectedViewId.current = defaultView.id
    }

    console.log('setting default view:', viewId)

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
      toast.warn(`Failed to set default view: ${error}`)
    }
  }
  return [defaultView, setSelectedView, previousSelectedViewId.current]
}
