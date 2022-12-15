import React from 'react'
import PropTypes from 'prop-types'
import { Button } from '@ynput/ayon-react-components'
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
`

const TagsEditor = ({ options = [], value = [], onChange }) => {
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

  return (
    <EditorContainer>
      <div>
        <h3>Selected</h3>
        <ButtonsContainer>
          {value.map((v) => (
            <Button
              label={v}
              icon="close"
              onClick={() => handleRemove(v)}
              key={v}
              style={{ backgroundColor: '#435648' }}
            />
          ))}
        </ButtonsContainer>
      </div>
      <div>
        <h3>Tags</h3>
        <ButtonsContainer>
          {options.map(
            ({ name }) =>
              !value.includes(name) && (
                <Button
                  label={name}
                  icon="add"
                  onClick={() => handleAdd(name)}
                  key={name}
                />
              )
          )}
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
