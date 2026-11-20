import { MouseEvent } from 'react'
import { Button, DefaultItemTemplate, Dropdown } from '@ynput/ayon-react-components'
import { useLocalStorage } from '@shared/hooks'
import {
  COLOR_SCHEMES,
  ColorScheme,
  DEFAULT_COLOR_SCHEME,
  getColorScheme,
  pickSchemeColors,
} from './colorSchemes'
import * as Styled from './ListColorScheme.styled'

type ListColorSchemeProps = {
  /** The list's field id: each list remembers its own scheme */
  listId: string
  /** Where the list sits in the form data */
  path: string[]
  /** The list's items, each with a `color` */
  items: Record<string, unknown>[]
  onSetValue: (path: string[], value: unknown) => void
}

// a long palette's preview stops here, so the menu and the button stay one width
const SWATCHES_SHOWN = 8

const SchemeSwatches = ({ colors }: { colors: string[] }) => (
  <Styled.Swatches aria-hidden>
    {colors.slice(0, SWATCHES_SHOWN).map((color) => (
      <Styled.Swatch key={color} style={{ backgroundColor: color }} />
    ))}
  </Styled.Swatches>
)

const schemeItemTemplate = (
  option: ColorScheme,
  isActive: boolean,
  isSelected: boolean,
  _index: number,
  mixedSelected: string[],
) => (
  <DefaultItemTemplate
    option={option}
    dataKey="id"
    labelKey="label"
    selected={isSelected ? [option.id] : []}
    mixedSelected={mixedSelected}
    value={isActive ? [option.id] : []}
    startContent={<SchemeSwatches colors={option.colors} />}
  />
)

/**
 * In the title row of a list of types, statuses or tags: the colour scheme to draw from,
 * and a button that gives every item of the list a random colour of that scheme.
 */
export const ListColorScheme = ({ listId, path, items, onSetValue }: ListColorSchemeProps) => {
  const [schemeId, setSchemeId] = useLocalStorage(
    `settings-color-scheme:${listId}`,
    DEFAULT_COLOR_SCHEME,
  )
  const scheme = getColorScheme(schemeId)

  const randomize = () => {
    const colors = pickSchemeColors(scheme, items.length)
    onSetValue(
      path,
      items.map((item, index) => ({ ...item, color: colors[index] })),
    )
  }

  // the title row selects the list when clicked; its controls act on their own
  const stop = (e: MouseEvent) => e.stopPropagation()

  return (
    <Styled.Wrapper className="settings-color-scheme" onClick={stop}>
      <Dropdown
        options={COLOR_SCHEMES}
        value={[scheme.id]}
        dataKey="id"
        labelKey="label"
        onSelectionChange={(selected: string[]) => selected[0] && setSchemeId(selected[0])}
        itemTemplate={schemeItemTemplate}
        // the menu is as wide as its longest name, opening toward the row's start
        align="right"
        itemStyle={{ whiteSpace: 'nowrap' }}
        listStyle={{ width: 'max-content' }}
        valueTemplate={() => (
          <Styled.Value>
            <SchemeSwatches colors={scheme.colors} />
            {scheme.label}
          </Styled.Value>
        )}
        data-tooltip="Color scheme to take the random colors from: published palettes by Tableau, Okabe-Ito and ColorBrewer"
      />
      <Button
        variant="text"
        icon="shuffle"
        aria-label="Randomize colors"
        data-tooltip={`Give every item a random ${scheme.label} color`}
        disabled={!items.length}
        onClick={randomize}
      />
    </Styled.Wrapper>
  )
}
