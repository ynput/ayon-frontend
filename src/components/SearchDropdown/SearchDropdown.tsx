import { KeyboardEvent, useEffect, useRef, useState } from 'react'
import { Icon } from '@ynput/ayon-react-components'
import {
  BackdropStyled,
  InputTextStyled,
  SearchStyled,
  SuggestionItemStyled,
  SuggestionsStyled,
} from './SearchDropdown.styled'
import { $Any } from '@types'

type Suggestion = {
  id: string
  icon: string
  label: string
  value: string
}

type Props = {
  suggestions: Suggestion[]
  suggestionsLimit: number
  placeholder: string
  isLoading: boolean
  hideSuggestions: boolean
  onSubmit: (a: $Any, b: $Any) => void
  onClear: () => void
  onFocus: () => void
  onClose: () => void
  filter: (newSearch: string, suggestions: Suggestion[]) => Suggestion[]
}

const SearchDropdown = ({
  suggestions = [],
  suggestionsLimit = 5,
  placeholder,
  isLoading,
  hideSuggestions = false,
  onSubmit,
  onClear,
  onFocus,
  onClose,
  filter,
}: Props) => {
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Suggestion[]>([])
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const [showAnimation, setShowAnimation] = useState(true)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [usingKeyboard, setUsingKeyboard] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)


  useEffect(() => {
    setSearchResults(suggestions)
  }, [suggestions])

  const handleFilterResults = (newSearch: string) => {
    // console.log('filtering search results by', newSearch)
    // if there is a filter use to filter out suggestions
    if (filter) {
      const newSuggestions = filter(newSearch, [...suggestions])
      setSearchResults(newSuggestions)
    }
  }

  const closeSearch = () => {
    // close suggestions
    setSuggestionsOpen(false)
    // defocus input
    inputRef.current!.blur()
    // reset animation
    setShowAnimation(true)
    // close callback
    onClose && onClose()
  }

  const handleSubmit = (e: $Any | null, useAll?: boolean, preventClose?: boolean) => {
    e && e.preventDefault()
    const input = inputRef.current!.value

    !preventClose && closeSearch()
    // if active index true find item
    const item = suggestionsSpliced[activeIndex!]

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

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      inputRef.current!.select()
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
  const handleKeyPress = (e: KeyboardEvent) => {
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

  const handleMouseEnter = (i: number) => {
    if (i !== activeIndex) setActiveIndex(i)
  }

  const handleMouseLeave = (i: number) => {
    if (i === activeIndex) setActiveIndex(null)
  }

  return (
    <SearchStyled
      onKeyDown={handleKeyPress}
      onMouseMove={() => usingKeyboard && setUsingKeyboard(false)}
    >
      {!hideSuggestions && suggestionsOpen && <BackdropStyled onClick={handleBlur} />}
      <InputTextStyled
        placeholder={placeholder}
        value={search}
        onChange={handleOnChange}
        onFocus={handleFocus}
        ref={inputRef}
        open={suggestionsOpen}
        autoComplete="off"
      />
      {!hideSuggestions && suggestionsOpen && (
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

export type { Suggestion }
export default SearchDropdown
