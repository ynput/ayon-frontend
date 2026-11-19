import styled from 'styled-components'

export const PageContainer = styled.div`
  position: relative;
  height: 100%;
  width: 100%;
  overflow: hidden;
  display: flex;

  /* project names are what people scan the list for */
  td[data-column-id='label'] .inner-td *:not(.icon) {
    font-weight: 600;
  }

  /* rows are inset cards with padded cells: the header labels start where the cell content does */
  thead th {
    padding-left: calc(var(--padding-m) + var(--padding-s));
  }

  /* the first column also carries the card's inset and border */
  thead th:first-child {
    padding-left: calc(2 * var(--padding-m) + var(--padding-s) + 2px);
  }
`
export const Thumbnail = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: var(--border-radius-m);
  overflow: hidden;
  background-color: var(--md-sys-color-surface-container-low);

  &:hover {
    background-color: var(--md-sys-color-surface-container-low-hover);
  }
`
