import {
  Button,
  Icon,
  InputNumber,
  InputSwitch,
  InputText,
  Spacer,
} from '@ynput/ayon-react-components'
import * as Styled from './FolderSequence.styled'
import TypeEditor from '@pages/EditorPage/TypeEditor'
import { useSelector } from 'react-redux'
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import getSequence from '@helpers/getSequence'

function formatSeq(arr, maxLength, prefix = '') {
  if (arr.length <= maxLength) {
    return arr.map((item) => prefix + item).join(', ')
  } else {
    const firstItems = arr.slice(0, Math.ceil(maxLength / 2)).map((item) => prefix + item)
    const lastItems = arr.slice(-1).map((item) => prefix + item)
    return `${firstItems.join(', ')} ... ${lastItems.join(', ')}`
  }
}

function getDefaultIncrements(type) {
  switch (type) {
    case 'Shot':
      return {
        base: '0010',
        increment: '0020',
        length: 10,
        difference: 10,
      }
    default:
      return {
        base: '001',
        increment: '002',
        length: 10,
        difference: 1,
      }
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
  typeSelectRef,
  onLastInputKeydown,
  ...props
}) => {
  const { base, increment, length, type, id, entityType, prefix, prefixDepth, parentBases } = props

  const disablePrefix = (!nesting && isRoot) || prefixDisabled

  const folders = useSelector((state) => state.project.folders) || []
  const tasks = useSelector((state) => state.project.tasks) || []

  const typeOptions = entityType === 'folder' ? folders : tasks

  let initSeq = []
  if (base && increment && length) {
    initSeq = getSequence(base, increment, length)
  }

  const [sequence, setSequence] = useState(initSeq)

  const baseRef = useRef(null)
  const prefixRef = useRef(null)
  const handleChange = (e) => {
    e?.preventDefault && e?.preventDefault()

    let { value, id: fieldId } = e.target

    if (fieldId === 'prefixDepth') {
      // convert to number
      value = parseInt(value, 10)
    }

    const newValue = { [fieldId]: value }

    const newState = { ...props, ...newValue }

    // if changing type, look to change base and increment
    if (fieldId === 'type') {
      // changing type
      // update name if newState.name matches any values in typeOptions
      let matches = false
      // loop through typeOptions and check if any match, when match is found we can stop looping
      for (const o in typeOptions) {
        if (newState.base === '') {
          matches = true
          break
        }
        const option = typeOptions[o]
        for (const key in option) {
          if (newState.base.toLowerCase().includes(option[key].toLowerCase())) {
            matches = true
            break
          }
        }
      }

      const typeOption = typeOptions[value]

      if (!matches || !typeOption) return
      // if name is same as type, update name
      const newName =
        entityType === 'folder' ? typeOption.shortName || typeOption.name : typeOption.name
      // add new state to new value

      // get default increments
      const suffixes = getDefaultIncrements(value)

      newState.base = newName + suffixes.base
      newState.increment = newName + suffixes.increment
      newState.length = suffixes.length
    }

    if (fieldId === 'base') {
      // get default increments
      const suffixes = getDefaultIncrements(newState.type)
      // split value into prefix (letter) and suffix (number)
      const prefix = value.replace(/[^a-zA-Z]/g, '')
      const suffix = value.replace(/[^0-9]/g, '')
      // get integer value of suffix and padding
      const suffixInt = parseInt(suffix, 10)
      const suffixPad = suffix.length

      const newIncrement =
        prefix + (suffixInt + suffixes.difference).toString().padStart(suffixPad, '0')

      newState.increment = newIncrement.replace('NaN', '')
    }

    onChange(newState, id, entityType)

    if (newState.base && newState.increment && newState.length) {
      // calculate the sequence
      const seq = getSequence(newState.base, newState.increment, newState.length)
      setSequence(seq)
    }

    // focus switch if not disabled else base input if changing type
    if (fieldId === 'type') {
      if (disablePrefix) {
        setTimeout(() => {
          baseRef.current.focus()
          baseRef.current.select()
        }, 50)
      } else {
        setTimeout(() => {
          prefixRef.current.focus()
        }, 50)
      }
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

          <label>Type</label>
          <TypeEditor
            value={[type]}
            onChange={(v) => handleChange({ target: { value: v, id: 'type' } })}
            options={tasks}
            style={{ width: 160 }}
            align="right"
          />

          <label>label</label>
          <InputText
            value={base}
            id={'base'}
            onChange={handleChange}
            placeholder="compositing..."
            autoComplete="off"
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
            <Styled.InputColumn>
              <label>Type</label>
              <TypeEditor
                value={[type]}
                onChange={(v) => handleChange({ target: { value: v, id: 'type' } })}
                options={folders}
                style={{ width: 160 }}
                align="right"
                ref={typeSelectRef}
              />
            </Styled.InputColumn>

            <Icon icon="trending_flat" />

            {(depth !== 0 || !nesting) && (
              <>
                <>
                  <Styled.InputColumn>
                    <label>Prefix</label>
                    <InputSwitch
                      checked={prefix}
                      id={'prefix'}
                      onChange={() => handleChange({ target: { value: !prefix, id: 'prefix' } })}
                      disabled={disablePrefix}
                      ref={prefixRef}
                      switchStyle={{ margin: '4px 0' }}
                    />
                  </Styled.InputColumn>
                  <Icon icon="trending_flat" />
                </>

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
                ref={baseRef}
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
            <Icon icon="trending_flat" />
            <Styled.InputColumn>
              <label>Count</label>
              <InputNumber
                value={length}
                id={'length'}
                onChange={handleChange}
                placeholder="15..."
                min={2}
                onFocus={(e) => e.target.select()}
                onKeyDown={onLastInputKeydown}
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
          {!nesting && <Styled.Example>Example: {sequenceString}</Styled.Example>}
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
