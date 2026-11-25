import styled from 'styled-components'

// no field matches the Details tab's search
export const NoMatches = styled.div`
  color: var(--md-sys-color-outline);
  min-height: 32px;
  display: flex;
  align-items: center;
`

// a group of related attributes: one row with a summary, opens to its members
export const GroupHeader = styled.button`
  display: grid;
  grid-template-columns: minmax(80px, 40%) minmax(0, 1fr) 32px;
  column-gap: 4px;
  align-items: center;
  width: 100%;
  min-height: 32px;
  padding: 0;
  border: none;
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  border-radius: 4px;

  &:hover {
    background-color: var(--md-sys-color-surface-container-low-hover);
  }

  .group-label {
    color: var(--md-sys-color-outline);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .group-summary {
    padding: 0 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--md-sys-color-on-surface);

    &.empty {
      color: var(--md-sys-color-outline);
    }
  }

  .icon {
    justify-self: center;
    color: var(--md-sys-color-outline);
    transition: transform 150ms;
  }

  &.open .icon {
    transform: rotate(180deg);
  }
`

export const GroupMembers = styled.div`
  margin-left: 8px;
  padding-left: 8px;
  border-left: 1px solid var(--md-sys-color-outline-variant);
`

// the "N empty fields" toggle between the filled and empty fields
export const EmptyToggle = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  min-height: 32px;
  margin-top: 4px;
  padding: 0 4px 0 0;
  border: none;
  border-top: 1px solid var(--md-sys-color-outline-variant);
  background: none;
  color: var(--md-sys-color-outline);
  font: inherit;
  cursor: pointer;

  &:hover {
    color: var(--md-sys-color-on-surface);
  }

  .icon {
    font-size: 18px;
  }
`

export const EmptyFields = styled.div`
  .field-label,
  .group-label {
    opacity: 0.8;
  }
`
