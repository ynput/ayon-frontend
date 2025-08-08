import { useCallback, useState } from 'react'
import { ViewType } from '..'

type Props = {
  viewType: ViewType
}

export const useViewSettingsChanged = ({
  viewType,
}: Props): [boolean, (changed: boolean) => void] => {
  // have there been settings changes to a view that had selected?
  // this determines if we should show the save button in the menu
  const [viewSettingsChanged, setViewSettingsChanged] = useState<{ [key: string]: boolean }>({})

  const onSettingsChanged = useCallback(
    (changed: boolean) => {
      if (!viewType) return
      setViewSettingsChanged((prev) => ({ ...prev, [viewType]: changed }))
    },
    [viewType, setViewSettingsChanged],
  )
  // extract the viewSettingsChanged state for the current viewType
  const isViewSettingsChanged = viewType ? viewSettingsChanged[viewType] : false

  return [isViewSettingsChanged, onSettingsChanged]
}
