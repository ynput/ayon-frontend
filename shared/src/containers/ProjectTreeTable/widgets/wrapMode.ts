import { css, type Interpolation } from 'styled-components'
import { WRAP_MIN_CELL_HEIGHT } from '../constants'

// styles that apply only once the cell is tall enough to fit wrapped content
export const wrapMode = (
  strings: TemplateStringsArray,
  ...interpolations: Interpolation<object>[]
) => css`
  @container cell (min-height: ${WRAP_MIN_CELL_HEIGHT}px) {
    ${css(strings, ...interpolations)}
  }
`
