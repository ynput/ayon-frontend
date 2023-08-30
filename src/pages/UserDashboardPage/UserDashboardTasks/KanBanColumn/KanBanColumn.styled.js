import styled, { css } from 'styled-components'

export const Column = styled.div`
  --min-height: 125px;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;

  height: min-content;
  min-width: 226px;
  min-height: var(--min-height);
  max-height: -webkit-fill-available;
  padding: 0;

  border-radius: 16px;
  background-color: var(--md-sys-color-surface-container-lowest);

  /* when a card is hovering over the top */
  .items > *:last-child {
    margin-bottom: 0;
    transition: margin-bottom 0.1s ease-in-out;
  }
  ${({ $isOverSelf, $isOver }) =>
    $isOver &&
    !$isOverSelf &&
    css`
      /* last child margin bottom */
      .items {
        & > *:last-child {
          margin-bottom: calc(var(--min-height) - 8px);
        }
      }
    `}

  ${({ $isOver }) =>
    $isOver &&
    css`
      &::after {
        content: '';
        position: absolute;
        inset: 0;
        background-color: white;
        opacity: 0.05;
        z-index: 500;
        border-radius: 16px;
      }
    `}
`

export const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px;

  h2 {
    margin: 0;
    /* text-align: center; */
    width: 100%;
  }

  width: 100%;
  border-bottom: solid 1px var(--md-sys-color-outline);
  border-color: ${({ $color }) => $color};
  margin-bottom: 8px;
`

export const Items = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding: 8px;
  padding-top: 0;
  padding-bottom: ${({ $isScrolling }) => ($isScrolling ? '30px' : '8px')};
  /* remove padding when scroll bar visible */
  padding-right: ${({ $isScrolling }) => ($isScrolling ? '0' : '8px')};

  overflow-x: hidden;
  overflow-y: auto;
  overflow-y: overlay;

  /* for columns that aren't active */
  ${({ $active, $isColumnActive, $isScrolling }) =>
    $active &&
    !$isColumnActive &&
    !$isScrolling &&
    css`
      overflow: hidden;
      padding-right: 8px;
    `}

  &::-webkit-scrollbar {
    width: unset;
  }
`
