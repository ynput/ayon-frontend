import styled, { css } from 'styled-components'
import { describeChange, getFieldId, OverrideDiff } from './settingsHistoryHelpers'

const selector = (id: string) => `[data-fieldid="${CSS.escape(id)}"]`

/** CSS string literal, the values can hold any text */
const cssString = (text: string) =>
  `"${text.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\s+/g, ' ')}"`

/** Where the change of a setting shows: after the field, or at the end of its panel's header */
const chipSelectors = (id: string) => {
  const field = `.form-inline-field${selector(id)}`
  return [
    `${field}::after`,
    `.panel${selector(id)} > .panel-header::after`,
    // the "enabled" toggle of a panel sits in its header, before the title
    `.panel-header:has(> .form-object-header-enabled-toggler ${field})::after`,
  ]
}

const highlight = (diffs: OverrideDiff[]) => {
  if (!diffs.length) return ''
  const fields = new Set<string>()
  const parents = new Set<string>()
  for (const { path } of diffs) {
    fields.add(getFieldId(path))
    for (let i = 1; i < path.length; i++) parents.add(getFieldId(path.slice(0, i)))
  }
  const fieldIds = [...fields]
  const parentIds = [...parents].filter((id) => !fields.has(id))
  const changes = diffs.map(
    (diff) => `
      ${chipSelectors(getFieldId(diff.path)).join(',')} {
        content: ${cssString(describeChange(diff))};
      }
    `,
  )
  return css`
    ${fieldIds.map((id) => `.form-inline-field${selector(id)}`).join(',')} {
      border-radius: 4px;
      background-color: var(--color-hl-compare-container);
      box-shadow: inset 3px 0 0 var(--color-hl-compare);
    }

    ${fieldIds.map((id) => `.panel${selector(id)} > .panel-header`).join(',')} {
      box-shadow: inset 0 0 0 1px var(--color-hl-compare);
    }

    ${parentIds.map((id) => `.panel${selector(id)} > .panel-header::after`).join(',')} {
      content: '';
      flex-shrink: 0;
      width: 8px;
      height: 8px;
      margin-left: 8px;
      border-radius: 50%;
      background-color: var(--color-hl-compare);
    }

    ${fieldIds
      .map((id) => `.form-object-header-enabled-toggler .form-inline-field${selector(id)}::after`)
      .join(',')} {
      content: none;
    }

    /* a panel's "enabled" toggle: the header is marked instead of the toggle */
    ${fieldIds
      .map((id) => `.form-object-header-enabled-toggler .form-inline-field${selector(id)}`)
      .join(',')} {
      background-color: transparent;
      box-shadow: none;
    }

    ${fieldIds
      .map(
        (id) =>
          `.panel-header:has(> .form-object-header-enabled-toggler .form-inline-field${selector(
            id,
          )})`,
      )
      .join(',')} {
      box-shadow: inset 0 0 0 1px var(--color-hl-compare);
    }

    ${fieldIds.flatMap(chipSelectors).join(',')} {
      flex-shrink: 0;
      align-self: center;
      width: auto;
      height: auto;
      max-width: 220px;
      margin-left: 8px;
      padding: 1px 6px;
      border-radius: 4px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-family: monospace;
      font-size: 11px;
      line-height: 16px;
      color: var(--color-hl-compare-text);
      background-color: var(--color-hl-compare-container);
    }

    ${changes.join('')}
  `
}

/** Marks the settings that differ from the compared time, with how they changed since */
export const ComparisonHighlight = styled.div<{ $diffs?: OverrideDiff[] }>`
  ${({ $diffs }) => highlight($diffs ?? [])}
`
