import React, { useMemo, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { InputText } from '@ynput/ayon-react-components'
import styled from 'styled-components'

const SearchStyled = styled.form`
  position: relative;
  width: 200;
  z-index: 10;
`

const InputTextStyled = styled(InputText)`
  width: 100%;
  z-index: 10;
  position: relative;
`

const SuggestionsStyled = styled.ul`
  position: absolute;
  display: flex;
  flex-direction: column;
  z-index: 10;
  outline: 1px solid #383838;
  background-color: var(--color-grey-00);
  border-radius: 3px;
  padding: 0px;
  margin: 0px;
  width: 100%;
  /* box-shadow: 0px 0px 5px 0px rgba(0, 0, 0, 0.75); */

  li {
    list-style: none;
    padding: 5px;
    padding-left: 10px;
    overflow: hidden;
    cursor: pointer;
    &:hover {
      background-color: var(--color-grey-02);
    }
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
}) => {
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const inputRef = useRef()

  const closeSearch = () => {
    // close suggestions
    setSuggestionsOpen(false)
    // defocus input
    inputRef.current.blur()
  }

  const handleSubmit = (e, id) => {
    e && e.preventDefault()
    const input = inputRef.current.value
    const suggestionValue = e.target.innerText

    closeSearch()

    // no search text clear search
    if (!input && !id) {
      console.log('clearing search')
      return onClear()
    }

    let ids = []
    if (id) {
      // clicked on specific item
      console.log('clicked suggestion', id, suggestionValue)
      onChange({ target: { value: suggestionValue } })
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

  suggestions = useMemo(() => {
    if (suggestionsLimit && suggestions.length > suggestionsLimit) {
      return suggestions.splice(0, suggestionsLimit)
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
      />
      {suggestionsOpen && (
        <SuggestionsStyled>
          {suggestions.length ? (
            suggestions.map(
              (item) =>
                item && (
                  <li key={item.id} onClick={(e) => handleSubmit(e, item.id)}>
                    {item.label || item.value}
                  </li>
                ),
            )
          ) : (
            <li key="none">No Results Found</li>
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
}

export default SearchDropdown
