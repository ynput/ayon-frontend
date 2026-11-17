import styled from 'styled-components'

export const Value = styled.span`
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
`

export const Item = styled.span`
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 4px;

  &.is-hidden {
    visibility: hidden;
  }

  /* the only value shown, too long for the field beside its count: cut to the width it is
     given (max-width). It doesn't shrink further: the unseen values after it overflow the
     field, and would squeeze it to nothing */
  &.is-clipped {
    overflow: hidden;

    > span:last-child {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
`

// keeps the room a cut value lost in the field's natural width; gives it up first
export const Sizer = styled.span`
  flex: 0 1 auto;
  min-width: 0;
  visibility: hidden;
`

export const ItemImage = styled.img`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  object-fit: cover;
`

// tabular digits at a width set by the count of values, so the room it takes doesn't change
// with the number of hidden values
export const More = styled.span`
  position: absolute;
  top: 50%;
  translate: 0 -50%;
  padding: 0 6px;
  border-radius: var(--border-radius-m);
  background-color: var(--md-sys-color-surface-container-highest);
  color: var(--md-sys-color-on-surface-variant);
  font-variant-numeric: tabular-nums;
  text-align: center;

  &.is-hidden {
    visibility: hidden;
  }
`
