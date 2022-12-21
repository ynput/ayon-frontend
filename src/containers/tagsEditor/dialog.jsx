import React, { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { Dialog } from 'primereact/dialog'
import { Button } from '@ynput/ayon-react-components'
import TagsEditor from './editor'

const TagsEditorDialog = ({ visible, onHide, onSuccess, value, tags, isLoading, isError }) => {
  // temp dialog
  const dialogRef = useRef(null)
  // Set a constant dialog height so that there's no popping
  const [height, setHeight] = useState(null)

  useEffect(() => {
    return () => {
      setHeight(null)
    }
  }, [visible])

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
    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
      <Button label={'Cancel'} onClick={handleCancel} />
      <Button label={'Save'} onClick={handleSuccess} />
    </div>
  )

  const header = (
    <div>
      <h2>Tags Editor</h2>
    </div>
  )

  if (isLoading || isError) return null

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      footer={footer}
      header={header}
      ref={dialogRef}
      onShow={() => setHeight(dialogRef.current?.getElement()?.offsetHeight + 15)}
      style={{ height: height || 'unset' }}
      contentStyle={{ overflow: 'hidden' }}
    >
      <TagsEditor value={selected} options={tags} onChange={handleOnChange} />
    </Dialog>
  )
}

export const tagsType = PropTypes.arrayOf(
  PropTypes.shape({
    name: PropTypes.string.isRequired,
    color: PropTypes.string,
  }),
)

TagsEditorDialog.propTypes = {
  visible: PropTypes.bool,
  onHide: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  value: PropTypes.arrayOf(PropTypes.string),
  tags: tagsType,
  isLoading: PropTypes.bool,
}

export default TagsEditorDialog
