import styled, { css } from 'styled-components'
import { COMPARE_COLOR, formatValue, getFieldId, OverrideDiff } from './settingsHistoryHelpers'

const selector = (id: string) => `[data-fieldid='${id.replace(/'/g, "\\'")}']`

/** CSS string literal, the values can hold any text */
const cssString = (text: string) =>
  `"${text.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\s+/g, ' ')}"`

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
  // the value then, next to the field (leaves) or in the header (lists)
  const thenValues = diffs.map((diff) => {
    const id = getFieldId(diff.path)
    const then = diff.sameValue ? 'overridden (same value)' : formatValue(diff.before, 32)
    const content = cssString(`then: ${then}`)
    return `
      .form-inline-field${selector(id)}::after,
      .panel${selector(id)} > .panel-header::after {
        content: ${content};
      }
    `
  })
  return css`
    ${fieldIds.map((id) => `.form-inline-field${selector(id)}`).join(',')} {
      border-radius: 4px;
      background-color: color-mix(in srgb, ${COMPARE_COLOR} 12%, transparent);
      box-shadow: inset 3px 0 0 ${COMPARE_COLOR};
    }

    ${fieldIds.map((id) => `.panel${selector(id)} > .panel-header`).join(',')} {
      box-shadow: inset 0 0 0 1px ${COMPARE_COLOR};
    }

    ${parentIds.map((id) => `.panel${selector(id)} > .panel-header::after`).join(',')} {
      content: '';
      flex-shrink: 0;
      width: 8px;
      height: 8px;
      margin-left: 8px;
      border-radius: 50%;
      background-color: ${COMPARE_COLOR};
    }

    ${fieldIds
      .map(
        (id) =>
          `.form-inline-field${selector(id)}::after, .panel${selector(id)} > .panel-header::after`,
      )
      .join(',')} {
      flex-shrink: 0;
      align-self: center;
      max-width: 220px;
      margin-left: 8px;
      padding: 1px 6px;
      border-radius: 4px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-family: monospace;
      font-size: 11px;
      color: ${COMPARE_COLOR};
      background-color: color-mix(in srgb, ${COMPARE_COLOR} 14%, transparent);
    }

    ${thenValues.join('')}
  `
}

/** Marks the settings that differ from the compared time, with their value then */
export const ComparisonHighlight = styled.div<{ $diffs?: OverrideDiff[] }>`
  ${({ $diffs }) => highlight($diffs ?? [])}
`
