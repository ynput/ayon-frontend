import { getTagColors, getTextColor } from '@ynput/ayon-react-components'

export type PillStyle = 'filled' | 'tinted'

// A coloured value shown as a pill: a status is filled with its full colour (as on status buttons and task
// progress cards), so it stands out; other coloured values are tinted like tags.
export const getPillColors = (color: string, style: PillStyle): React.CSSProperties => {
  if (style === 'filled') return { backgroundColor: color, color: getTextColor(color) }
  const colors = getTagColors(color)
  return {
    color: colors.text,
    backgroundColor: colors.background,
    boxShadow: `inset 0 0 0 1px ${colors.border}`,
  }
}
