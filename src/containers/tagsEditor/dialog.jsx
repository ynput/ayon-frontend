import React, { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { Dialog } from 'primereact/dialog'
import { Button } from 'ayon-react-components-test'
import TagsEditor from './editor'

const TagsEditorDialog = ({ visible, onHide, onSuccess, value, tags, isLoading, isError }) => {
  // temp dialog
  const dialogRef = useRef(null)
  // Set a constant dialog height so that there's no popping
  const [height, setHeight] = useState(null)
  // If multiple entities tags are being edited
  const [isMulti, setIsMulti] = useState(false)
  // currently multi select always overwrites
  const [isOverwrite, setIsOverwrite] = useState(false)
  // all the names of the entities
  const [names, setNames] = useState([])

  useEffect(() => {
    return () => {
      setHeight(null)
    }
  }, [visible])

  // temp state of selected tags
  const [selected, setSelected] = useState([])

  useEffect(() => {
    if (!isLoading && !isError) {
      const allNames = []
      // all tags and remove any "shared" duplicate tags
      // removes the ids from the tags so all ids tags will get overwritten
      const allTags = Object.values(value).reduce((result, { tags, name }, index) => {
        // set isMulti
        if (index === 1) {
          setIsMulti(true)
          // for now multi select will always casuse overwrite
          setIsOverwrite(true)
        }
        // set names
        allNames.push(name)
        // only add tags to result if not already there
        tags.forEach((t) => !result.includes(t) && result.push(t))
        return result
      }, [])

      // set states
      setNames(allNames)
      setSelected(allTags)

      return () => {
        setSelected([])
      }
    }
  }, [visible, setSelected, isLoading, isError])

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
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
      <Button label={'Cancel'} onClick={handleCancel} />
      <Button
        label={isOverwrite ? 'Overwite All' : 'Save'}
        onClick={handleSuccess}
        style={{ backgroundColor: isOverwrite && 'red' }}
      />
    </div>
  )

  const header = (
    <div>
      <h2>{`Tags Editor${isMulti ? ' (Multiple)' : ''}: ${names.join(', ')}`}</h2>
      {isOverwrite && <span>Warning: All Tags will be applied to all Entities.</span>}
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

// global tags to choose from
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
  value: PropTypes.object,
  tags: tagsType,
  isLoading: PropTypes.bool,
}

export default TagsEditorDialog
