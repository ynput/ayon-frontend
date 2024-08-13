import React, { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { Icon, InputText } from '@ynput/ayon-react-components'
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
  ${({ activeIndex, index }) =>
    activeIndex === index &&
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

const SearchDropdown = ({
  suggestions = [],
  suggestionsLimit = 5,
  isLoading,
  onSubmit,
  onClear,
  onFocus,
  onClose,
  filter,
}) => {
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const [showAnimation, setShowAnimation] = useState(true)
  const [activeIndex, setActiveIndex] = useState(null)
  const [usingKeyboard, setUsingKeyboard] = useState(false)
  const inputRef = useRef()

  useEffect(() => {
    setSearchResults(suggestions)
  }, [suggestions, setSearchResults])

  const handleFilterResults = (newSearch) => {
    // console.log('filtering search results by', newSearch)
    // if there is a filter use to filter out suggestions
    if (filter) {
      let newSuggestions = filter(newSearch, [...suggestions])
      setSearchResults(newSuggestions)
    }
  }

  const closeSearch = () => {
    // close suggestions
    setSuggestionsOpen(false)
    // defocus input
    inputRef.current.blur()
    // reset animation
    setShowAnimation(true)
    // close callback
    onClose && onClose()
  }

  const handleSubmit = (e, useAll, preventClose) => {
    e && e.preventDefault()
    const input = inputRef.current.value

    !preventClose && closeSearch()
    // if active index true find item
    const item = suggestionsSpliced[activeIndex]

    // no search text clear search
    if (!input && useAll) {
      console.log('clearing search')
      // reset results
      setSearchResults(suggestions)
      return onClear && onClear()
    }

    let results = []
    let finalSearch = search

    if (item && !useAll) {
      // clicked on specific item
      console.log('clicked suggestion', item.id, item.value)
      finalSearch = item.value
      setSearch(finalSearch)
      results = [item]
    } else {
      results = searchResults
    }

    console.log('submitting search with: ', results.length, ' result found.')

    // onSubmit callback
    onSubmit(results, finalSearch)

    // update search results
    handleFilterResults(finalSearch)
  }

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (search) {
        handleSubmit(null, true, true)
      }
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  }, [search])

  const handleOnChange = (e) => {
    const inputText = e.target.value
    setSearch(inputText)

    handleFilterResults(inputText)

    setSuggestionsOpen(!!inputText)

    if (!inputText) {
      console.log('clear')
      onClear()
    }
  }

  const handleBlur = () => {
    handleSubmit(null, true)
  }

  const handleFocus = () => {
    // onFocus callback
    onFocus && onFocus()

    if (search) {
      // if there's text select all the text
      inputRef.current.select()
      // and open suggestions
      setSuggestionsOpen(true)
    }
  }

  const spliceSuggestionsDown = () => {
    // only splice if the amount of suggestions is more than the limit
    if (suggestionsLimit && searchResults.length > suggestionsLimit) {
      let start = 0
      if (!search) start += 2
      return [...searchResults].splice(start, suggestionsLimit)
    } else return searchResults
  }

  const suggestionsSpliced = spliceSuggestionsDown()

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
    if (e.keyCode === 13) {
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
        placeholder="Filter folders & tasks..."
        value={search}
        onChange={handleOnChange}
        onFocus={handleFocus}
        ref={inputRef}
        open={suggestionsOpen}
        autoComplete="off"
      />
      {suggestionsOpen && (
        <SuggestionsStyled
          open={suggestionsOpen}
          items={suggestionsSpliced.length}
          limit={suggestionsLimit}
          showResults={(search && searchResults.length > suggestionsLimit) || !searchResults.length}
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
                  {item?.icon && <Icon icon={item?.icon} />}
                  <span className="text">{item.label || item.value}</span>
                </SuggestionItemStyled>
              ),
          )}
          {isLoading ? (
            <SuggestionItemStyled key="loading" activeIndex={null}>
              Loading...
            </SuggestionItemStyled>
          ) : (
            search &&
            (searchResults.length > suggestionsLimit || !searchResults.length) && (
              <SuggestionItemStyled className="results" activeIndex={null}>
                <span>{`${searchResults.length} Results`}</span>
              </SuggestionItemStyled>
            )
          )}
        </SuggestionsStyled>
      )}
    </SearchStyled>
  )
}

SearchDropdown.propTypes = {
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
  isLoading: PropTypes.bool,
  onClear: PropTypes.func,
  onClose: PropTypes.func,
  onFocus: PropTypes.func,
  filter: PropTypes.func,
}

export default SearchDropdown
