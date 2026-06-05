import { FC } from 'react'
import { InputSwitch } from '@ynput/ayon-react-components'
import * as Styled from './TableFooter.styled'
import {
  MainCountLabels,
  RowScope,
  SummaryFormat,
  buildRowScope,
  buildSummaryFormat,
  formatHasCount,
  formatHasPercent,
  scopeHasGroups,
  scopeHasRows,
} from './summaryTypes'

type Toggle = { label: string; checked: boolean; onChange: (checked: boolean) => void }

const ToggleRow: FC<{ toggles: Toggle[] }> = ({ toggles }) => (
  <Styled.ToggleRow>
    {toggles.map((t) => (
      <label key={t.label}>
        <InputSwitch
          checked={t.checked}
          onChange={(e) => t.onChange((e.target as HTMLInputElement).checked)}
        />
        {t.label}
      </label>
    ))}
  </Styled.ToggleRow>
)

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

// One-line Folders/Tasks (or Products/Versions) row-scope toggles.
export const ScopeToggles: FC<{
  scope: RowScope
  onChange: (scope: RowScope) => void
  labels: MainCountLabels
}> = ({ scope, onChange, labels }) => {
  if (!labels.secondary) return null
  return (
    <ToggleRow
      toggles={[
        {
          label: cap(labels.primary),
          checked: scopeHasGroups(scope),
          onChange: (checked) => onChange(buildRowScope(checked, scopeHasRows(scope))),
        },
        {
          label: cap(labels.secondary),
          checked: scopeHasRows(scope),
          onChange: (checked) => onChange(buildRowScope(scopeHasGroups(scope), checked)),
        },
      ]}
    />
  )
}

// One-line Count/Percentage display-format toggles.
export const FormatToggles: FC<{
  format: SummaryFormat
  onChange: (format: SummaryFormat) => void
}> = ({ format, onChange }) => (
  <ToggleRow
    toggles={[
      {
        label: 'Count',
        checked: formatHasCount(format),
        onChange: (checked) => onChange(buildSummaryFormat(checked, formatHasPercent(format))),
      },
      {
        label: 'Percentage',
        checked: formatHasPercent(format),
        onChange: (checked) => onChange(buildSummaryFormat(formatHasCount(format), checked)),
      },
    ]}
  />
)
