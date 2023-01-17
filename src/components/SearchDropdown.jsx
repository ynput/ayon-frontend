import React, { useMemo, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { InputText } from '@ynput/ayon-react-components'
import styled, { css, keyframes } from 'styled-components'

const SearchStyled = styled.form`
  position: relative;
  width: 200;
  z-index: 10;
`

const InputTextStyled = styled(InputText)`
  width: 100%;
  z-index: 10;
  position: relative;
  transition: border 0.2s;

  /* open styles */
  ${({ open }) =>
    open &&
    css`
      &:not(:focus) {
        border-radius: 3px 3px 0 0;
      }
    `}
`

const openAnimation = (limit) => keyframes`
  from {
    height: 0;
  }
  to {
    height: ${limit * 30}px
  }
`

const SuggestionsStyled = styled.ul`
  position: absolute;
  display: flex;
  flex-direction: column;
  z-index: 9;
  border: 1px solid var(--color-grey-03);
  border-top: none;
  background-color: var(--color-grey-00);
  border-radius: 0 0 3px 3px;
  padding: 0px;
  margin: 0px;
  width: 100%;
  overflow: hidden;

  /* opening animation */
  height: 0;
  transition: height 0.15s;
  ${({ open, items, showResults }) =>
    open &&
    css`
      height: ${(items + showResults) * 30}px;
      animation: ${(props) => props.showAnimation && openAnimation(props.items)} 0.15s;
      animation-iteration-count: 1;
    `}
`

const SuggestionItemStyled = styled.li`
  list-style: none;
  padding: 0 5px;
  min-height: 30px;
  overflow: hidden;
  cursor: pointer;

  display: flex;
  align-items: center;
  gap: 5px;

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

  &:hover {
    background-color: var(--color-grey-02);
  }

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

const SearchDropdown = ({
  value,
  onChange,
  suggestions = [],
  suggestionsLimit,
  onSubmit,
  onClear,
  isLoading,
}) => {
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const [showAnimation, setShowAnimation] = useState(true)
  const inputRef = useRef()

  const closeSearch = () => {
    // close suggestions
    setSuggestionsOpen(false)
    // defocus input
    inputRef.current.blur()
    // reset animation
    setShowAnimation(true)
  }

  const handleSubmit = (e, id, value) => {
    e && e.preventDefault()
    const input = inputRef.current.value

    closeSearch()

    // no search text clear search
    if (!input && !id) {
      console.log('clearing search')
      return onClear()
    }

    let ids = []
    if (id) {
      // clicked on specific item
      console.log('clicked suggestion', id, value)
      onChange({ target: { value: value } })
      ids = [id]
    } else {
      ids = suggestions.map((s) => s.id)
    }

    console.log('submitting search', ids)

    onSubmit(ids)
  }

  const handleBlur = () => {
    console.log('blurring')
    closeSearch()
  }

  const suggestionsSpliced = useMemo(() => {
    if (suggestionsLimit && suggestions.length > suggestionsLimit) {
      return [...suggestions].splice(0, suggestionsLimit)
    } else return suggestions
  }, [suggestions])

  return (
    <SearchStyled onSubmit={handleSubmit}>
      {suggestionsOpen && <BackdropStyled onClick={handleBlur} />}
      <InputTextStyled
        placeholder="Filter folders..."
        value={value}
        onChange={onChange}
        onFocus={() => setSuggestionsOpen(true)}
        ref={inputRef}
        open={suggestionsOpen}
      />
      {suggestionsOpen && (
        <SuggestionsStyled
          open={suggestionsOpen}
          items={suggestionsSpliced.length}
          limit={suggestionsLimit}
          showResults={(value && suggestions.length > suggestionsLimit) || !suggestions.length}
          onAnimationEnd={() => setShowAnimation(false)}
          showAnimation={showAnimation}
        >
          {suggestionsSpliced.map(
            (item) =>
              item && (
                <SuggestionItemStyled
                  key={item.id}
                  onClick={(e) => handleSubmit(e, item.id, item.value)}
                >
                  {item.icon && <span className="material-symbols-outlined icon">{item.icon}</span>}
                  <span className="text">{item.label || item.value}</span>
                </SuggestionItemStyled>
              ),
          )}
          {isLoading ? (
            <SuggestionItemStyled key="loading">Loading...</SuggestionItemStyled>
          ) : (
            value &&
            (suggestions.length > suggestionsLimit || !suggestions.length) && (
              <SuggestionItemStyled className="results">
                <span>{`${suggestions.length} Results`}</span>
              </SuggestionItemStyled>
            )
          )}
        </SuggestionsStyled>
      )}
    </SearchStyled>
  )
}

SearchDropdown.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  suggestions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      id: PropTypes.string.isRequired,
      label: PropTypes.string,
      icon: PropTypes.string,
    }).isRequired,
  ).isRequired,
  suggestionsLimit: PropTypes.number,
  onSubmit: PropTypes.func.isRequired,
  onClear: PropTypes.func,
  isLoading: PropTypes.bool,
}

export default SearchDropdown
