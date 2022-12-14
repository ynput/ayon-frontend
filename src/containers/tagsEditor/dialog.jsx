import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { Dialog } from 'primereact/dialog'
import { Button } from 'openpype-components'
import TagsEditor from './editor'

const TagsEditorDialog = ({ visible, onHide, onSuccess, value, tags }) => {
  // temp state of selected tags
  const [selected, setSelected] = useState([])

  useEffect(() => {
    setSelected([...value])
    return () => {
      setSelected([])
    }
  }, [value, visible, setSelected])

  const handleSuccess = () => {
    console.log('Success')
    onHide()
    onSuccess(selected)
  }

  const handleCancel = () => {
    console.log('Cancel')
    onHide()
  }

  const handleOnChange = (value) => {
    console.log(value)
    // update state with new calue
    setSelected(value)
  }

  const footer = (
    <div style={{ display: 'flex', gap: '20px' }}>
      <Button label={'Cancel'} onClick={handleCancel} />
      <Button label={'Save'} onClick={handleSuccess} />
    </div>
  )

  const header = (
    <div>
      <h2>Tags Editor</h2>
    </div>
  )

  return (
    <Dialog visible={visible} onHide={onHide} footer={footer} header={header}>
      <TagsEditor value={selected} options={tags} onChange={handleOnChange} />
    </Dialog>
  )
}

export const tagsType = PropTypes.arrayOf(
  PropTypes.shape({
    name: PropTypes.string.isRequired,
    color: PropTypes.string,
  })
)

TagsEditorDialog.propTypes = {
  visible: PropTypes.bool,
  onHide: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  value: PropTypes.arrayOf(PropTypes.string),
  tags: tagsType,
}

export default TagsEditorDialog
