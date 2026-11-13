import {
  Button,
  InputColor,
  isReadableOnLight,
  makeReadableOnLight,
} from '@ynput/ayon-react-components'
import * as Styled from './ThemeColorInput.styled'

// The colour of an item that has a light theme colour too, with a sample of it on the dark theme.
export const DarkColorInput = (props: React.ComponentProps<typeof InputColor>) => (
  <Styled.Row>
    <InputColor {...props} />
    {typeof props.value === 'string' && (
      <Styled.Sample
        data-theme="dark"
        style={{ color: props.value }}
        data-tooltip="On the dark theme"
      >
        Aa
      </Styled.Sample>
    )}
  </Styled.Row>
)

type LightColorInputProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> & {
  value?: string | null
  // the item's colour, which the light theme shows while no light colour is picked
  baseColor?: string
  // the contrast the colour needs on the light theme: MIN_CONTRAST_ICON for colours mostly shown as icons
  minContrast?: number
  onChange: (value: string | undefined) => void
  disabled?: boolean
}

// A colour picked for the light theme. While it's empty the light theme shows the item's colour.
export const LightColorInput = ({
  value,
  baseColor,
  minContrast,
  onChange,
  disabled,
  ...props
}: LightColorInputProps) => {
  const color = value || baseColor

  return (
    <Styled.Row {...props}>
      <InputColor
        value={color || '#ffffff'}
        data-tooltip={value ? undefined : 'Same as the color. Pick a color to change it.'}
        onChange={(e) => {
          const picked = e.target.value as string
          // closing the picker on the colour doesn't pin it
          if (!value && picked === baseColor) return
          onChange(picked)
        }}
      />
      {color && (
        <Styled.Sample data-theme="light" style={{ color }} data-tooltip="On the light theme">
          Aa
        </Styled.Sample>
      )}
      {color && !isReadableOnLight(color, minContrast) && (
        <Styled.Fix
          icon="warning"
          variant="text"
          disabled={disabled}
          data-tooltip="Hard to read on the light theme. Click to darken it just enough."
          onClick={() => onChange(makeReadableOnLight(color, minContrast))}
        />
      )}
      {value && !disabled && (
        <Button
          icon="undo"
          variant="text"
          data-tooltip="Use the same color"
          onClick={() => onChange(undefined)}
        />
      )}
    </Styled.Row>
  )
}
