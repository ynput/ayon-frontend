import PropTypes from 'prop-types'
import { useEffect } from 'react'
import { useState } from 'react'
import { useRef } from 'react'
import styled, { css, keyframes } from 'styled-components'
import { InputText } from '@ynput/ayon-react-components'
import { isEqual } from 'lodash'

// background acts as a blocker
const BackdropStyled = styled.div`
  position: fixed;
  inset: 0;
  background-color: unset;
  z-index: 11;
`

const dropdownMenuAnimation = keyframes`
  0% {
    transform: scale(.95);
    opacity: .6;
}
100% {
    transform: scale(1);
    opacity: 1;
}
`

const ContainerStyled = styled.div`
  position: relative;
  height: ${({ height }) => `${height}px`};
  width: auto;
  display: inline-block;

  position: fixed;
  z-index: 60;

  transform-origin: top;

  ${({ startAnimation }) =>
    startAnimation
      ? css`
          animation: ${dropdownMenuAnimation} 0.03s ease-in forwards;
        `
      : css`
          opacity: 0;
        `}

  /* position: fixed; */

  /* show warning when changing multiple entities */
  ${({ isOpen, message }) =>
    isOpen &&
    message &&
    css`
      &::before {
        content: '${message}';
        top: 0;
        translate: 0 -100%;
        position: absolute;
        background-color: var(--color-grey-00);
        border-radius: var(--border-radius) var(--border-radius) 0 0;
        z-index: 10;
        display: flex;
        align-items: center;
        padding: 4px 0;
        right: 0;
        left: 0;
        outline: 1px solid #383838;
        justify-content: center;
      }
    `}
`

const OptionsStyled = styled.ul`
  width: auto;
  list-style-type: none;
  padding: unset;

  display: flex;
  flex-direction: column;

  margin: 0px;
  /* same border used as primereact dropdowns */
  outline: 1px solid #383838;
  background-color: var(--color-grey-00);
  z-index: 20;
  border-radius: ${({ message }) =>
    message ? '0 0 var(--border-radius) var(--border-radius)' : 'var(--border-radius)'};
  overflow: clip;

  transition: max-height 0.15s;

  /* scrolling */
  max-height: 300px;
  overflow-y: scroll;

  ::-webkit-scrollbar {
    display: none;
  }
`

const SearchStyled = styled.form`
  /* put to top of list */
  order: -2;
  position: relative;
  height: 29px;
  width: 100%;

  /* search icon */
  span {
    position: absolute;
    left: 4px;
    top: 50%;
    translate: 0 -50%;
    z-index: 10;
  }

  /* input */
  input {
    width: calc(100% + 2px);
    position: relative;
    left: -1px;
    height: 100%;
    text-indent: 24px;

    border-radius: var(--border-radius) var(--border-radius) 0 0;

    &:focus {
      outline: unset;
    }
  }
`

const Dropdown = ({
  value = [],
  valueItem,
  valueField = 'value',
  options = [],
  optionsItem,
  style,
  searchFields = ['value'],
  message,
  onClose,
  onChange,
  onOpen,
  widthExpand,
  align = 'left',
  multiSelect,
  search,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  // Style states
  const [pos, setPos] = useState({ x: null, y: null })
  const [startAnimation, setStartAnimation] = useState(false)
  const [minWidth, setMinWidth] = useState()
  // search
  const [searchForm, setSearchForm] = useState('')
  // selection
  const [selected, setSelected] = useState([])

  const valueRef = useRef(null)
  const optionsRef = useRef(null)

  // sets the correct position and height
  useEffect(() => {
    if (isOpen && valueRef.current && optionsRef.current) {
      const valueRec = valueRef.current.getBoundingClientRect()
      const valueWidth = valueRec.width

      const optionsRec = optionsRef.current.getBoundingClientRect()
      const optionsWidth = optionsRec.width
      const optionsheight = optionsRec.height

      let x = valueRec.x
      let y = valueRec.y

      if (align === 'right') {
        x = x + valueWidth - optionsWidth
      }

      // check it's not vertically off screen
      if (optionsheight + y > window.innerHeight) {
        y = window.innerHeight - optionsheight
      }

      // first set position
      setPos({ x, y })
      if (widthExpand) setMinWidth(valueWidth)

      // then start animation
      setStartAnimation(true)
    } else {
      setStartAnimation(false)
    }
  }, [isOpen, valueRef, optionsRef, setMinWidth, setStartAnimation, setPos])

  useEffect(() => {
    setSelected(value)
  }, [value, setSelected])

  if (search && searchForm) {
    // filter out search matches
    options = options.filter((o) =>
      searchFields.some((key) => o[key]?.toLowerCase()?.includes(searchForm)),
    )
  }

  // HANDLERS

  const handleClose = (e, changeValue) => {
    // changeValue is used on single select
    changeValue = changeValue || selected

    e?.stopPropagation()

    // close dropdown
    setIsOpen(false)

    // callback
    onClose && onClose()

    // reset search
    setSearchForm('')

    // check for difs
    if (isEqual(changeValue, value)) return
    // commit changes
    onChange && onChange(changeValue)
    //   reset selected
    setSelected([])
  }

  const handleChange = (e, value) => {
    e?.stopPropagation()

    let newSelected = [...selected]

    if (!multiSelect) {
      // replace current value with new one
      newSelected = [value]
    } else {
      // add/remove from selected
      if (newSelected.includes(value)) {
        // remove
        newSelected.splice(newSelected.indexOf(value), 1)
      } else {
        // add
        newSelected.push(value)
      }
    }
    // update state
    setSelected(newSelected)
    // if not multi, close
    if (!multiSelect) handleClose(undefined, newSelected)
  }

  const handleOpen = (e) => {
    e.stopPropagation()
    setIsOpen(true)

    onOpen && onOpen()
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()

    // if we started with none and none select, pick to one
    if (!value.length && !selected.length) {
      if (options.length) {
        handleClose(undefined, [options[0][valueField]])
      }
    } else {
      // close normally
      handleClose()
    }
  }

  return (
    <>
      {value && (
        <div ref={valueRef} onClick={handleOpen}>
          {valueItem()}
        </div>
      )}
      {isOpen && <BackdropStyled onClick={handleClose} />}
      {isOpen && options && (
        <ContainerStyled
          style={{ left: pos?.x, top: pos?.y, ...style }}
          message={message}
          isOpen={true}
          startAnimation={startAnimation}
        >
          {search && (
            <SearchStyled onSubmit={handleSearchSubmit}>
              <span className="material-symbols-outlined">search</span>
              <InputText
                label="search"
                value={searchForm}
                onChange={(e) => setSearchForm(e.target.value)}
                autoFocus
              />
            </SearchStyled>
          )}
          <OptionsStyled isOpen={isOpen} message={message} ref={optionsRef} style={{ minWidth }}>
            {options.map((option) => (
              <li
                key={option[valueField]}
                onClick={(e) => handleChange(e, option[valueField])}
                style={{ order: value.includes(option.name) ? -1 : 0 }}
              >
                {optionsItem(option, value.includes(option.name), selected.includes(option.name))}
              </li>
            ))}
          </OptionsStyled>
        </ContainerStyled>
      )}
    </>
  )
}

Dropdown.propTypes = {
  message: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
  style: PropTypes.object,
  onOpen: PropTypes.func,
  onClose: PropTypes.func,
  value: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
  valueItem: PropTypes.func,
  valueField: PropTypes.string,
  options: PropTypes.array.isRequired,
  optionsItem: PropTypes.func,
  align: PropTypes.oneOf(['left', 'right']),
  multiSelect: PropTypes.bool,
  search: PropTypes.bool,
}

export default Dropdown
