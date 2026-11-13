import { FC } from 'react'
import { Button, Icon } from '@ynput/ayon-react-components'
import type { QueryFilter } from '@shared/containers/ProjectTreeTable/types/operations'
import {
  AdvancedFilterField,
  countAdvancedFilterRules,
} from '@shared/containers/ProjectTreeTable/utils/advancedFilter'
import { PowerpackButton } from '../Powerpack'
import {
  ADVANCED_FILTER_COMPACT_WIDTH,
  ADVANCED_FILTER_LABEL,
  ADVANCED_FILTER_MAX_DEPTH,
} from './AdvancedFilterSlotHelpers'
import type { AdvancedFilterEditor } from './useAdvancedFilterEditor'
import { useParentNarrowerThan } from './useParentNarrowerThan'
import * as Styled from './AdvancedFilterSlot.styled'

const LABEL = ADVANCED_FILTER_LABEL

export interface AdvancedFilterSlotProps {
  value?: QueryFilter
  onChange: (value: QueryFilter | undefined) => void
  // from useAdvancedFilterInSearchBar
  editor: AdvancedFilterEditor
  fields: AdvancedFilterField[]
  // opens the editor each time it changes
  openRequest?: number
  disabled?: boolean
  // toolbar width below which the control is an icon with the count badge
  compactBelow?: number
}

// The advanced filter control next to a search bar. The editor is the Power Pack module
// `AdvancedFilter`. Without it a stored filter still applies: it is shown as a chip that can
// only be removed.
export const AdvancedFilterSlot: FC<AdvancedFilterSlotProps> = ({
  value,
  onChange,
  editor: { Editor, powerLicense, isLoading, outdated },
  fields,
  openRequest,
  disabled,
  compactBelow = ADVANCED_FILTER_COMPACT_WIDTH,
}) => {
  const [markerRef, compact] = useParentNarrowerThan(compactBelow)

  const label = compact ? undefined : LABEL

  const renderControl = () => {
    if (Editor) {
      return (
        <Editor
          value={value}
          onChange={onChange}
          fields={fields}
          disabled={disabled}
          maxDepth={ADVANCED_FILTER_MAX_DEPTH}
          compact={compact}
          openRequest={openRequest}
        />
      )
    }

    if (value) {
      return (
        <Styled.Chip
          data-tooltip={`${
            compact ? `${LABEL}: ` : ''
          }This filter is applied. It can only be removed here.`}
        >
          <Icon icon="filter_alt" />
          {label}
          <span className="count">{countAdvancedFilterRules(value)}</span>
          <Button
            className="remove"
            icon="close"
            variant="text"
            data-tooltip="Remove advanced filter"
            disabled={disabled}
            onClick={() => onChange(undefined)}
          />
        </Styled.Chip>
      )
    }

    // keeps the place of the editor's button while the license or the module loads
    if (isLoading) {
      return <Button className="loading" icon="filter_alt" label={label} disabled />
    }

    if (powerLicense) {
      const reason = outdated
        ? `Update the Power Pack to ${outdated.required} or newer to use the advanced filter.`
        : 'The advanced filter is not available.'
      return (
        <Button
          icon="filter_alt"
          label={label}
          disabled
          data-tooltip={compact ? `${LABEL}: ${reason}` : reason}
        />
      )
    }

    // opens the Power Pack dialog
    return (
      <PowerpackButton
        feature="advancedFilters"
        variant="surface"
        rounded={false}
        label={label}
        aria-label={LABEL}
        // narrow: the filter icon with the bolt after it
        {...(compact && { icon: 'filter_alt', bolt: true })}
      />
    )
  }

  return (
    <>
      {/* hidden: only used to find the toolbar this control sits in */}
      <span ref={markerRef} hidden />
      {renderControl()}
    </>
  )
}
