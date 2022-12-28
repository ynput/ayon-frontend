import React, { useState, useMemo } from 'react'
import PropTypes from 'prop-types'
import { Button, InputText } from '@ynput/ayon-react-components'
import styled from 'styled-components'
import CreateButton from './createButton'

const EditorContainerStyled = styled.div`
  max-width: 400px;
  width: 90vw;
  display: flex;
  flex-direction: column;
  gap: 20px;

  /* enable scrolling om avaible section */
  overflow-y: hidden;
  height: 100%;
`

const ButtonsContainerStyled = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 10px;
  min-height: 65px;

  /* form fills whole row to push artist tags to a new line */
  form {
    flex-basis: 100%;
    align-self: flex-end;
  }
`

// wraps avaiable header and buttons
const SectionsWrapperStyled = styled.div`
  /* scrolling for overflow */
  overflow-y: auto;
`

const AvailableHeaderStyled = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const TagsEditor = ({ options = [], value = [], onChange }) => {
  const [search, setSearch] = useState('')
  const [newItem, setNewItem] = useState('')

  const handleRemove = (v) => {
    console.log('removing:', v)
    const newValue = [...value]
    // get index pos of v
    const index = newValue.indexOf(v)

    // add if v IS in value array
    if (index !== -1) {
      newValue.splice(index, 1)
      onChange(newValue)
    } else {
      console.warn(`REMOVE OPTION FAILED: ${v} already NOT in value: ${value.toString}`)
    }
  }

  const handleAdd = (v) => {
    console.log('adding:', v)
    const newValue = [...value]
    // get index pos of v
    const index = newValue.indexOf(v)

    // add if v NOT in value
    if (index === -1) {
      newValue.push(v)
      onChange(newValue)
    } else {
      console.warn(`ADD OPTION FAILED: ${v} already in value: ${value.toString}`)
    }
  }

  // creating a new "artist tag"
  const handleCreate = (e) => {
    e.preventDefault()
    // check item is not empty string and not already added
    if (!newItem || newItem === '' || value.includes(newItem)) return

    console.log('add new tag:', newItem)
    handleAdd(newItem)
    // clear input
    setNewItem('')
  }

  // filter out already selected options
  let filteredOptions = options.filter(({ name }) => !value.includes(name))
  if (search !== '') {
    // filter results if searched
    filteredOptions = filteredOptions.filter(({ name }) => name.includes(search))
  }

  const optionsObject = useMemo(
    () => options.reduce((acc, cur) => ({ ...acc, [cur.name]: cur }), {}),
    [options],
  )

  // sort tags by "artist" and "global"
  const [globalTags, artistTags] = value.reduce(
    (result, tag) => {
      result[tag in optionsObject ? 0 : 1].push(tag) // Determine and push to global/artist arr
      return result
    },
    [[], []],
  )

  return (
    <EditorContainerStyled>
      <div>
        <h3>Assigned</h3>
        <ButtonsContainerStyled>
          {[...globalTags, ...artistTags].map((v) => {
            // get object from options otherwise "artist" tag
            const isArtist = !optionsObject[v]
            const value = optionsObject[v]

            return (
              <Button
                label={v}
                icon="close"
                onClick={() => handleRemove(v)}
                key={v}
                style={{
                  gap: 3,
                  borderLeft: !isArtist && `solid 4px ${value.color}`,
                  order: isArtist && 1,
                }}
              />
            )
          })}
          <CreateButton
            placeholder="New Artist Tag..."
            onSubmit={handleCreate}
            noSpaces
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
          />
        </ButtonsContainerStyled>
      </div>
      <SectionsWrapperStyled>
        <AvailableHeaderStyled>
          <h3>Available</h3>
          <InputText
            placeholder={'Search Tags...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </AvailableHeaderStyled>
        <ButtonsContainerStyled>
          {filteredOptions.length
            ? filteredOptions.map(({ name, color }) => (
                <Button
                  label={name}
                  icon="add"
                  onClick={() => handleAdd(name)}
                  key={name}
                  style={{
                    gap: 3,
                    borderLeft: `solid 4px ${color}`,
                  }}
                />
              ))
            : 'No results found in search...'}
        </ButtonsContainerStyled>
      </SectionsWrapperStyled>
    </EditorContainerStyled>
  )
}

TagsEditor.propTypes = {
  options: PropTypes.arrayOf(PropTypes.shape({ name: PropTypes.string.isRequired })),
  value: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
}

export default TagsEditor
