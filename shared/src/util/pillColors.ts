import { getTagColors, getTextColor, type UserColor } from '@ynput/ayon-react-components'

export type PillStyle = 'filled' | 'tinted'

// A coloured value shown as a pill: a status is filled with its full colour (as on status buttons and task
// progress cards), so it stands out; other coloured values are tinted like tags.
export const getPillColors = (
  value: UserColor & { color: string },
  style: PillStyle,
): React.CSSProperties => {
  if (style === 'filled') return { backgroundColor: value.color, color: getTextColor(value.color) }
  const colors = getTagColors(value)
  return {
    color: colors.text,
    backgroundColor: colors.background,
    boxShadow: `inset 0 0 0 1px ${colors.border}`,
  }
}
