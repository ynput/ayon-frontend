import React, { useState, useMemo } from 'react'
import PropTypes from 'prop-types'
import { Button, InputText } from 'openpype-components'
import styled from 'styled-components'

const EditorContainer = styled.div`
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 20px;

  &::after {
    content: '';
    height: 30px;
  }
`

const ButtonsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 10px;
`

const AvailableHeader = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const TagsEditor = ({ options = [], value = [], onChange }) => {
  const [search, setSearch] = useState('')

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
      console.warn(
        `REMOVE OPTION FAILED: ${v} already NOT in value: ${value.toString}`
      )
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
      console.warn(
        `ADD OPTION FAILED: ${v} already in value: ${value.toString}`
      )
    }
  }

  // filter out already selected options
  let filteredOptions = options.filter(({ name }) => !value.includes(name))
  if (search !== '') {
    // filter results if searched
    filteredOptions = filteredOptions.filter(({ name }) =>
      name.includes(search)
    )
  }

  const optionsObject = useMemo(
    () => options.reduce((acc, cur) => ({ ...acc, [cur.name]: cur }), {}),
    [options]
  )

  return (
    <EditorContainer>
      <div>
        <h3>Assigned</h3>
        <ButtonsContainer>
          {value.map((v) => {
            const value = optionsObject[v]
            return (
              <Button
                label={v}
                icon="close"
                onClick={() => handleRemove(v)}
                key={v}
                style={{
                  gap: 3,
                  borderLeft: `solid 4px ${value.color}`,
                }}
              />
            )
          })}
        </ButtonsContainer>
      </div>
      <div>
        <AvailableHeader>
          <h3>Available</h3>
          <InputText
            placeholder={'Search tags...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </AvailableHeader>
        <ButtonsContainer>
          {filteredOptions.map(({ name, color }) => (
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
          ))}
        </ButtonsContainer>
      </div>
    </EditorContainer>
  )
}

TagsEditor.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({ name: PropTypes.string.isRequired })
  ),
  value: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
}

export default TagsEditor
