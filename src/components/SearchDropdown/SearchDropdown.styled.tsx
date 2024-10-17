import { InputText } from '@ynput/ayon-react-components'
import styled, { css, keyframes } from 'styled-components'

const SearchStyled = styled.form`
  position: relative;
  width: 100%;
  z-index: 10;
`

const InputTextStyled = styled(InputText)<{ open: boolean }>`
  width: 100%;
  z-index: 10;
  position: relative;
  transition: border 0.2s;

  /* open styles */
  ${(props) =>
    props.open &&
    css`
      &:not(:focus) {
        border-radius: 3px 3px 0 0;
      }
    `}
`

const openAnimation = (limit: number) => keyframes`
  from {
    height: 0;
  }
  to {
    height: ${limit * 30}px
  }
`

const SuggestionsStyled = styled.ul<{
  open: boolean
  items: number
  limit: number
  showResults: boolean
  showAnimation: boolean
}>`
  position: absolute;
  display: flex;
  flex-direction: column;
  z-index: 9;
  border: 1px solid var(--md-sys-color-outline-variant);
  border-top: none;
  background-color: var(--md-sys-color-surface-container-low);
  border-radius: 0 0 3px 3px;
  padding: 0px;
  margin: 0px;
  width: 100%;
  overflow: hidden;

  /* opening animation */
  height: 0;
  transition: height 0.15s;
  ${(props) =>
    props.open &&
    css`
      height: ${(props.items + (props.showResults ? 1: 0)) * 30}px;
      animation: ${props.showAnimation && openAnimation(props.limit)} 0.15s;
      animation-iteration-count: 1;
    `}
`

const SuggestionItemStyled = styled.li<{ activeIndex: number | null; index?: number }>`
  list-style: none;
  padding: 0 5px;
  min-height: 30px;
  overflow: hidden;
  cursor: pointer;
  user-select: none;

  display: flex;
  align-items: center;
  gap: var(--base-gap-small);

  /* ICON STYLES */
  span.icon {
    font-size: 18px;
  }

  /* TEXT STYLES */
  span.text {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  /* active by keyboard */
  ${(props) =>
    props.activeIndex === props.index &&
    css`
      background-color: var(--md-sys-color-surface-container-low-hover);
    `}

  &.results span {
    text-align: center;
    width: 100%;
    opacity: 0.5;
  }
`

const BackdropStyled = styled.div`
  position: fixed;
  inset: 0;
  z-index: 0;
`

export { SearchStyled, InputTextStyled, SuggestionsStyled, SuggestionItemStyled, BackdropStyled }
