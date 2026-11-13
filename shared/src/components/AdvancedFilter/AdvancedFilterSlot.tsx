import { FC, useMemo } from 'react'
import { Button, Icon, Option } from '@ynput/ayon-react-components'
import { usePowerpack } from '@shared/context'
import { useAfterStartup } from '@shared/hooks/useAfterStartup'
import { useLoadModule } from '@shared/hooks/useLoadModule'
import type { QueryFilter } from '@shared/containers/ProjectTreeTable/types/operations'
import {
  AdvancedFilterField,
  AdvancedFilterProps,
  buildAdvancedFilterFields,
  countAdvancedFilterRules,
} from '@shared/containers/ProjectTreeTable/utils/advancedFilter'
import { PowerpackButton } from '../Powerpack'
import {
  ADVANCED_FILTER_COMPACT_WIDTH,
  ADVANCED_FILTER_MAX_DEPTH,
  ADVANCED_FILTER_MIN_VERSION,
} from './AdvancedFilterSlotHelpers'
import { useParentNarrowerThan } from './useParentNarrowerThan'
import * as Styled from './AdvancedFilterSlot.styled'

const LABEL = 'Advanced filter'
const NO_FIELDS: AdvancedFilterField[] = []

export interface AdvancedFilterSlotProps {
  value?: QueryFilter
  onChange: (value: QueryFilter | undefined) => void
  // the options of the search bar next to it: the fields that can be filtered by
  options: Option[]
  // entity types of a multi-scope page
  scopes?: string[]
  // option ids that can't be used in the advanced filter
  exclude?: string[]
  disabled?: boolean
  // toolbar width below which the control is an icon with the count badge
  compactBelow?: number
}

// `compact` asks the editor to show its button as an icon with the count badge
type AdvancedFilterEditorProps = AdvancedFilterProps & { compact?: boolean }

// The advanced filter control next to a search bar. The editor is the Power Pack module
// `AdvancedFilter`. Without it a stored filter still applies: it is shown as a chip that can
// only be removed.
export const AdvancedFilterSlot: FC<AdvancedFilterSlotProps> = ({
  value,
  onChange,
  options,
  scopes,
  exclude,
  disabled,
  compactBelow = ADVANCED_FILTER_COMPACT_WIDTH,
}) => {
  const [markerRef, compact] = useParentNarrowerThan(compactBelow)
  const { powerLicense, isLoading: isLoadingLicense } = usePowerpack()
  // the table doesn't wait for the editor, so it is loaded after the page
  const isReady = useAfterStartup()

  const [AdvancedFilter, { isLoaded, isLoading, outdated }] =
    useLoadModule<FC<AdvancedFilterEditorProps> | null>({
      addon: 'powerpack',
      remote: 'views',
      module: 'AdvancedFilter',
      fallback: null,
      minVersion: ADVANCED_FILTER_MIN_VERSION,
      skip: !powerLicense,
      defer: !isReady,
    })
  const Editor = isLoaded ? AdvancedFilter : null

  // The options are rebuilt on every render. The editor gets a new list only when a field
  // changed (compared without `loadValues`, which is kept from the first list).
  const builtFields = Editor ? buildAdvancedFilterFields(options, { scopes, exclude }) : NO_FIELDS
  const fieldsKey = JSON.stringify(builtFields)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fields = useMemo(() => builtFields, [fieldsKey])

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
    if (isLoadingLicense || (powerLicense && (isLoading || !isReady))) {
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
