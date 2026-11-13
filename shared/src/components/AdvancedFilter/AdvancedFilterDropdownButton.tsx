import { FC } from 'react'
import { Button } from '@ynput/ayon-react-components'
import { PowerpackButton } from '../Powerpack'
import { ADVANCED_FILTER_LABEL } from './AdvancedFilterSlotHelpers'
import type { AdvancedFilterEditor } from './useAdvancedFilterEditor'

export interface AdvancedFilterDropdownButtonProps {
  // from useAdvancedFilterEditor
  editor: AdvancedFilterEditor
  onOpen: () => void
}

// In the bottom bar of the search bar's dropdown, next to Confirm: points to the advanced
// filter for what the simple filter can't do. Nothing while the editor loads or when the
// Power Pack is too old (the control next to the search bar says why).
export const AdvancedFilterDropdownButton: FC<AdvancedFilterDropdownButtonProps> = ({
  editor: { Editor, powerLicense, isLoading },
  onOpen,
}) => {
  if (Editor) {
    return (
      <Button
        icon="filter_alt"
        label={ADVANCED_FILTER_LABEL}
        variant="surface"
        data-tooltip="Exclude values, match all of them, or combine filters with and / or"
        onClick={onOpen}
      />
    )
  }

  if (isLoading || powerLicense) return null

  // opens the Power Pack dialog
  return (
    <PowerpackButton
      feature="advancedFilters"
      variant="surface"
      rounded={false}
      icon="filter_alt"
      bolt
      label={ADVANCED_FILTER_LABEL}
    />
  )
}
