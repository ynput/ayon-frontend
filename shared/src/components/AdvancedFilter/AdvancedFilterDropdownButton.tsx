import { FC, MouseEvent } from 'react'
import { Button } from '@ynput/ayon-react-components'
import { PowerpackButton } from '../Powerpack'
import type { AdvancedFilterEditor } from './useAdvancedFilterEditor'

const LABEL = 'Switch to advanced filter'

export interface AdvancedFilterDropdownButtonProps {
  // from useAdvancedFilterInSearchBar
  editor: AdvancedFilterEditor
  // the id of the filter being edited (null if it can't be found)
  onSwitch: (filterId: string | null) => void
}

// The filter being edited, from its values in the dropdown list
const getEditedFilterId = (event: MouseEvent<HTMLElement>) =>
  event.currentTarget
    .closest('ul')
    ?.querySelector('li[data-parent]')
    ?.getAttribute('data-parent') ?? null

// In the bottom bar of the search bar's dropdown, next to Confirm: moves the filter being edited
// into the advanced filter, for what the simple filter can't do. Nothing while the editor loads
// or when the Power Pack is too old (the control next to the search bar says why).
export const AdvancedFilterDropdownButton: FC<AdvancedFilterDropdownButtonProps> = ({
  editor: { Editor, powerLicense, isLoading },
  onSwitch,
}) => {
  if (Editor) {
    return (
      <Button
        icon="filter_alt"
        label={LABEL}
        variant="surface"
        data-tooltip="Exclude values, match all of them, or combine this filter with others using and / or"
        onClick={(event) => onSwitch(getEditedFilterId(event))}
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
      label={LABEL}
    />
  )
}
