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

  /* active by keyboard */
  ${({ activeIndex, index }) =>
    activeIndex === index &&
    css`
      background-color: var(--color-grey-02);
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

const SearchDropdown = ({
  value,
  onChange,
  suggestions = [],
  suggestionsLimit = 5,
  onSubmit,
  onClear,
  isLoading,
}) => {
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const [showAnimation, setShowAnimation] = useState(true)
  const [activeIndex, setActiveIndex] = useState(null)
  const [usingKeyboard, setUsingKeyboard] = useState(false)
  const inputRef = useRef()

  const closeSearch = () => {
    // close suggestions
    setSuggestionsOpen(false)
    // defocus input
    inputRef.current.blur()
    // reset animation
    setShowAnimation(true)
  }

  const handleSubmit = (e, useAll) => {
    e && e.preventDefault()
    const input = inputRef.current.value

    closeSearch()
    // if active index true find item
    const item = suggestionsSpliced[activeIndex]
    console.log(item)

    // no search text clear search
    if (!input && !item.id) {
      console.log('clearing search')
      return onClear()
    }

    let ids = []

    if (item && !useAll) {
      // clicked on specific item
      console.log('clicked suggestion', item.id, item.value)
      onChange({ target: { value: item.value } })
      ids = [item.id]
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

  // KEY BOARD CONTROL
  const handleKeyPress = (e) => {
    // NAVIGATE DOWN
    if (e.code === 'ArrowDown') {
      if (activeIndex === null || activeIndex >= suggestionsSpliced.length - 1) {
        // got to top
        setActiveIndex(0)
      } else {
        // go down one
        setActiveIndex(activeIndex + 1)
      }
    }

    // NAVIGATE UP
    if (e.code === 'ArrowUp') {
      if (!activeIndex || activeIndex <= 0) {
        // go to bottom
        setActiveIndex(suggestionsSpliced.length - 1)
      } else {
        // go one up
        setActiveIndex(activeIndex - 1)
      }
    }

    if (e.code === 'ArrowDown' || e.code === 'ArrowUp') {
      e.preventDefault()
      if (!usingKeyboard) setUsingKeyboard(true)
    }

    // SUBMIT WITH ENTER
    if (e.code === 'Enter') {
      // prevent reloads
      e.preventDefault()

      handleSubmit(null, !usingKeyboard)
    }

    // CLOSE WITH ESC
    if (e.code === 'Escape') {
      closeSearch()
    }
  }

  const handleMouseEnter = (i) => {
    if (i !== activeIndex) setActiveIndex(i)
  }

  const handleMouseLeave = (i) => {
    if (i === activeIndex) setActiveIndex(null)
  }

  return (
    <SearchStyled
      onKeyDown={handleKeyPress}
      onMouseMove={() => usingKeyboard && setUsingKeyboard(false)}
    >
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
            (item, i) =>
              item && (
                <SuggestionItemStyled
                  key={item.id}
                  onClick={handleSubmit}
                  tabIndex={0}
                  activeIndex={activeIndex}
                  index={i}
                  onMouseEnter={() => handleMouseEnter(i)}
                  onMouseLeave={() => handleMouseLeave(i)}
                >
                  {item.icon && <span className="material-symbols-outlined icon">{item.icon}</span>}
                  <span className="text">{item.label || item.value}</span>
                </SuggestionItemStyled>
              ),
          )}
          {isLoading ? (
            <SuggestionItemStyled key="loading" activeIndex={null}>
              Loading...
            </SuggestionItemStyled>
          ) : (
            value &&
            (suggestions.length > suggestionsLimit || !suggestions.length) && (
              <SuggestionItemStyled className="results" activeIndex={null}>
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
