import styled from 'styled-components'

// The table in a picker dialog. Rows that can't be picked are muted, not struck through, and their
// reason gets the space it needs (the name truncates first) so it never paints over other text
// (&& outranks SimpleTable's disabled rule).
export const PickerTableContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;
  min-height: 0;
  width: 100%;

  && .disabled {
    .value {
      text-decoration: none;
    }
    .text {
      min-width: 0;
    }
    .badges {
      flex-shrink: 0;
    }
    .badges span {
      white-space: nowrap;
    }
  }
`
