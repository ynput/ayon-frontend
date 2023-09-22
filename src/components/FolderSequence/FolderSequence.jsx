import {
  Button,
  Icon,
  InputNumber,
  InputSwitch,
  InputText,
  Spacer,
} from '@ynput/ayon-react-components'
import * as Styled from './FolderSequence.styled'
import TypeEditor from '/src/pages/EditorPage/TypeEditor'
import { useSelector } from 'react-redux'
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import getSequence from '/src/helpers/getSequence'

function formatSeq(arr, maxLength, prefix = '') {
  if (arr.length <= maxLength) {
    return arr.map((item) => prefix + item).join(', ')
  } else {
    const firstItems = arr.slice(0, Math.ceil(maxLength / 2)).map((item) => prefix + item)
    const lastItems = arr.slice(-1).map((item) => prefix + item)
    return `${firstItems.join(', ')} ... ${lastItems.join(', ')}`
  }
}

const FolderSequence = ({
  onChange,
  parentId = null,
  children,
  depth,
  onNew,
  index,
  nesting = true,
  isRoot,
  prefixExample = '',
  prefixDisabled,
  ...props
}) => {
  const folders = useSelector((state) => state.project.folders) || []
  const tasks = useSelector((state) => state.project.tasks) || []

  const { base, increment, length, type, id, entityType, prefix, prefixDepth, parentBases } = props

  let initSeq = []
  if (base && increment && length) {
    initSeq = getSequence(base, increment, length)
  }

  const [sequence, setSequence] = useState(initSeq)

  const handleChange = (e) => {
    e?.preventDefault && e?.preventDefault()

    let { value, id: fieldId } = e.target

    if (fieldId === 'prefixDepth') {
      // convert to number
      value = parseInt(value, 10)
    }

    const newValue = { [fieldId]: value }

    if (entityType === 'task' && fieldId === 'type') {
      if (type === base || !base) {
        // update base to match new type
        newValue.base = value
      }
    }

    if (fieldId === 'base') {
      let increment = value

      const startNumber = parseInt((value.match(/\d+$/) || [])[0], 10)
      if (startNumber) {
        const baseWithoutNumber = value.replace(/\d+$/, '')
        // count digits in start number and then add ten to the number for the increment
        const numDigits = startNumber.toString().length
        const number = startNumber + parseInt('1' + '0'.repeat(Math.max(numDigits - 2, 0)))
        const paddedNumber = String(number).padStart(value.match(/\d+$/)[0].length, '0')

        increment = baseWithoutNumber + paddedNumber
      }
      // also update increment
      newValue.increment = increment
    }

    onChange(newValue, id, entityType)

    const newForm = { ...props, ...newValue }
    if (newForm.base && newForm.increment && newForm.length) {
      // calculate the sequence
      const seq = getSequence(newForm.base, newForm.increment, newForm.length)
      setSequence(seq)
    }
  }

  // when first mounting, it's a new item
  const [isNew, setIsNew] = useState(true)
  // after 3 seconds, it's no longer new
  useEffect(
    () => {
      const timer = setTimeout(() => {
        setIsNew(false)
      }, 1000)
      return () => clearTimeout(timer)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const sequenceString = formatSeq(sequence, 5, prefixExample)

  const seqRef = useRef(null)
  const [seqWidth, setSeqWidth] = useState(0)
  useLayoutEffect(() => {
    if (seqRef.current) {
      setSeqWidth(seqRef.current.offsetWidth)
    }
  }, [seqRef.current, prefix])

  if (entityType === 'task') {
    return (
      <Styled.TaskContainer
        $isNew={isNew}
        $index={index}
        $depth={depth}
        className="task"
        $nesting={nesting}
      >
        <Styled.SequenceForm className="form">
          <Icon icon="task_alt" />
          <strong>Task</strong>
          <label>label</label>
          <InputText
            value={base}
            id={'base'}
            onChange={handleChange}
            placeholder="compositing..."
            autoComplete="off"
          />

          <label>Type</label>
          <TypeEditor
            value={[type]}
            onChange={(v) => handleChange({ target: { value: v, id: 'type' } })}
            options={tasks}
            style={{ width: 160 }}
            align="right"
          />

          <Button
            icon={'close'}
            variant="text"
            onClick={() => onChange({ id, delete: true }, parentId)}
            className="delete"
          />
        </Styled.SequenceForm>
      </Styled.TaskContainer>
    )
  }

  return (
    <Styled.FolderSequenceWrapper $depth={depth} $index={index} className="folder">
      <Styled.RowWrapper $depth={depth} className="seq">
        {nesting && (
          <Styled.AddButtons className="buttons">
            <Styled.SequenceForm>
              {/* add new root folder */}
              {depth === 0 && (
                <Button
                  icon={'south'}
                  onClick={() => onNew(null)}
                  label="Root"
                  title="add root folder"
                />
              )}
              {/* provide it's parents id for new sibling */}
              <Button
                icon={'create_new_folder'}
                onClick={() => onNew(id, 'folder')}
                label={depth === 0 && 'Folder'}
                title="add nested folder"
              />
            </Styled.SequenceForm>
            {/* provide it's own id for new child */}
            <Button
              icon={'add_task'}
              onClick={() => onNew(id, 'task')}
              label={depth === 0 && 'Task'}
              title="add nested task"
              style={{ width: 'max-content', marginLeft: 'auto' }}
            />
          </Styled.AddButtons>
        )}
        <Styled.SequenceContainer $isNew={isNew} $nesting={nesting} ref={seqRef}>
          <Styled.SequenceForm className="form folder">
            {(depth !== 0 || !nesting) && (
              <>
                <Styled.InputColumn>
                  <label>Prefix</label>
                  <InputSwitch
                    checked={prefix}
                    id={'prefix'}
                    onChange={() => handleChange({ target: { value: !prefix, id: 'prefix' } })}
                    disabled={(!nesting && isRoot) || prefixDisabled}
                  />
                </Styled.InputColumn>
                {nesting && prefix && (
                  <Styled.InputColumn>
                    <label>Depth</label>
                    <InputNumber
                      value={prefixDepth}
                      id={'prefixDepth'}
                      onChange={handleChange}
                      max={parentBases.length}
                      min={0}
                    />
                  </Styled.InputColumn>
                )}
              </>
            )}

            <Icon icon="trending_flat" />

            {parentBases && nesting && (
              <Styled.InputColumn style={{ display: prefix ? 'flex' : 'none' }}>
                <Styled.Prefix>{parentBases.join('')}</Styled.Prefix>
              </Styled.InputColumn>
            )}

            <Styled.InputColumn className="seq">
              <label>First Name</label>
              <InputText
                value={base}
                id={'base'}
                onChange={handleChange}
                placeholder="ep101..."
                autoComplete="off"
              />
            </Styled.InputColumn>
            <Icon icon="trending_flat" />
            <Styled.InputColumn className="seq">
              <label>Second Name</label>
              <InputText
                value={increment}
                id={'increment'}
                onChange={handleChange}
                placeholder="ep102..."
                autoComplete="off"
              />
            </Styled.InputColumn>

            <Styled.InputColumn>
              <label>Count</label>
              <InputNumber
                value={length}
                id={'length'}
                onChange={handleChange}
                placeholder="15..."
                min={2}
                onFocus={(e) => e.target.select()}
              />
            </Styled.InputColumn>

            <Styled.InputColumn>
              <label>Type</label>
              <TypeEditor
                value={[type]}
                onChange={(v) => handleChange({ target: { value: v, id: 'type' } })}
                options={folders}
                style={{ width: 160 }}
                align="right"
              />
            </Styled.InputColumn>
            <Spacer />
            {nesting && (
              <Button
                icon={'close'}
                variant="text"
                onClick={() => onChange({ id, delete: true })}
                disabled={depth === 0 && index === 0}
              />
            )}
          </Styled.SequenceForm>
          {!nesting && base && increment && (
            <Styled.Example>Example: {sequenceString}</Styled.Example>
          )}
        </Styled.SequenceContainer>
      </Styled.RowWrapper>
      {nesting && (
        <Styled.Children className="children" style={{ width: seqWidth }}>
          {children}
        </Styled.Children>
      )}
    </Styled.FolderSequenceWrapper>
  )
}

export default FolderSequence
