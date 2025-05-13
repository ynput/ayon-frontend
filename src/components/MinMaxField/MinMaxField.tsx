import { Button, InputNumber } from '@ynput/ayon-react-components'
import { useEffect, useRef, useState, ChangeEvent, RefObject } from 'react'
import styled from 'styled-components'

const Field = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: var(--base-gap-small);

  input {
    width: 100%;
  }
`

interface ValueObject {
  le?: number
  lt?: number
  ge?: number
  gt?: number
}

interface MinMaxFieldProps {
  value?: ValueObject
  isMin: boolean
  isFloat?: boolean
  onChange: (newValue: ValueObject) => void
}

const MinMaxField = ({ value = {}, isMin, isFloat = false, onChange }: MinMaxFieldProps) => {
  const { le, lt, ge, gt } = value
  const min = ge ?? gt
  const max = le ?? lt
  const inputRef: RefObject<HTMLInputElement> = useRef(null)

  const fieldValue = isMin ? min : max
  const fieldKey = isMin ? 'g' : 'l'
  const equalsKey = (fieldKey + 'e') as 'ge' | 'le'
  const moreThanKey = fieldKey + 't'

  const [isEqual, setIsEqual] = useState(value[equalsKey] != undefined || !isFloat)

  //   when changing from float to integer
  //   ensure all values are equals: ge or le
  // convert all values to integers
  useEffect(() => {
    if (!isFloat) {
      onChange({ [equalsKey]: parseInt(String(fieldValue))?.toString(), [moreThanKey]: undefined })
      setIsEqual(true)
    } else {
      // When switching to float, if there's a value, ensure it's set with 'equals'
      // and it's a string for the input.
      if (fieldValue !== undefined) {
        onChange({ [equalsKey]: String(fieldValue), [moreThanKey]: undefined })
      }
      setIsEqual(true)
    }
  }, [isFloat])

  const handleOnChange = (e: ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    if (isFloat) {
      if (isEqual) {
        onChange({ [equalsKey]: inputValue, [moreThanKey]: undefined })
      } else {
        onChange({ [equalsKey]: undefined, [moreThanKey]: inputValue })
      }
    } else {
      onChange({ [equalsKey]: inputValue, [moreThanKey]: undefined })
    }

    // clear custom validity
    if (inputRef.current) {
      inputRef.current.setCustomValidity('')
    }
  }

  const handleEqualsSwitch = () => {
    const newIsEqual = !isEqual
    setIsEqual(newIsEqual)
    if (newIsEqual) {
      onChange({ [moreThanKey]: undefined, [equalsKey]: fieldValue })
    } else {
      onChange({ [moreThanKey]: fieldValue, [equalsKey]: undefined })
    }
  }

  const greaterOrLess = isMin ? 'greater' : 'less'
  const greaterOrLessIcon = isMin ? '>' : '<'
  const greaterOrLessEqualsIcon = isMin ? '≥' : '≤'
  const equalsToolTip = `Determines if the value should be '${greaterOrLess} than or equal to' (${greaterOrLessEqualsIcon}) or 'strictly ${greaterOrLess} than' (${greaterOrLessIcon}). Currently: ${
    isEqual ? greaterOrLessEqualsIcon : greaterOrLessIcon
  }`

  return (
    <Field>
      <InputNumber
        value={fieldValue === undefined ? '' : fieldValue}
        onChange={handleOnChange}
        step={isFloat ? 'any' : 1}
        min={isMin ? undefined : min}
        max={isMin ? max : undefined}
        ref={inputRef}
      />
      {isFloat && (
        <Button
          label={greaterOrLessEqualsIcon}
          selected={isEqual}
          onClick={handleEqualsSwitch}
          data-tooltip={equalsToolTip}
          data-tooltip-delay={0}
        />
      )}
    </Field>
  )
}

export default MinMaxField
