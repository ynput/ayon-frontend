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
import { ADVANCED_FILTER_MAX_DEPTH, ADVANCED_FILTER_MIN_VERSION } from './AdvancedFilterSlotHelpers'
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
}

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
}) => {
  const { powerLicense, isLoading: isLoadingLicense } = usePowerpack()
  // the table doesn't wait for the editor, so it is loaded after the page
  const isReady = useAfterStartup()

  const [AdvancedFilter, { isLoaded, isLoading, outdated }] =
    useLoadModule<FC<AdvancedFilterProps> | null>({
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

  if (Editor) {
    return (
      <Editor
        value={value}
        onChange={onChange}
        fields={fields}
        disabled={disabled}
        maxDepth={ADVANCED_FILTER_MAX_DEPTH}
      />
    )
  }

  if (value) {
    return (
      <Styled.Chip data-tooltip="This filter is applied. It can only be removed here.">
        <Icon icon="filter_alt" />
        {LABEL}
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
    return <Button className="loading" icon="filter_alt" label={LABEL} disabled />
  }

  if (powerLicense) {
    return (
      <Button
        icon="filter_alt"
        label={LABEL}
        disabled
        data-tooltip={
          outdated
            ? `Update the Power Pack to ${outdated.required} or newer to use the advanced filter.`
            : 'The advanced filter is not available.'
        }
      />
    )
  }

  // opens the Power Pack dialog
  return (
    <PowerpackButton feature="advancedFilters" variant="surface" rounded={false} label={LABEL} />
  )
}
