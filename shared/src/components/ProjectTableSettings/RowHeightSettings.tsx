import { FC, useState, useCallback, useEffect } from 'react'
import styled from 'styled-components'
import { useColumnSettingsContext } from '@shared/containers/ProjectTreeTable'

// Debounce hook for smooth slider performance
const useDebounce = (value: number, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

const Container = styled.div`
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const Label = styled.label`
  font-weight: 500;
  color: var(--md-sys-color-on-surface);
  font-size: 14px;
`

const SliderContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

const Slider = styled.input`
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: var(--md-sys-color-outline);
  outline: none;
  -webkit-appearance: none;
  appearance: none;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--md-sys-color-primary);
    cursor: pointer;
    border: 2px solid var(--md-sys-color-surface);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--md-sys-color-primary);
    cursor: pointer;
    border: 2px solid var(--md-sys-color-surface);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  &:hover::-webkit-slider-thumb {
    background: var(--md-sys-color-primary-container);
  }

  &:hover::-moz-range-thumb {
    background: var(--md-sys-color-primary-container);
  }
`

const ValueDisplay = styled.span`
  font-size: 14px;
  color: var(--md-sys-color-on-surface-variant);
  min-width: 40px;
  text-align: right;
`

const RowHeightSettings: FC = () => {
  const { rowHeight: contextRowHeight = 34, updateRowHeight, updateRowHeightWithPersistence } = useColumnSettingsContext()

  // Local state for immediate UI updates during slider drag
  const [localRowHeight, setLocalRowHeight] = useState(contextRowHeight)

  // Debounced value for smooth table updates during drag
  const debouncedRowHeight = useDebounce(localRowHeight, 25)

  // Sync with context row height when it changes externally
  useEffect(() => {
    setLocalRowHeight(contextRowHeight)
  }, [contextRowHeight])

  // Update table rows immediately during slider drag (no API persistence)
  useEffect(() => {
    updateRowHeight(localRowHeight)
  }, [debouncedRowHeight, updateRowHeight, localRowHeight])

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalRowHeight(parseInt(e.target.value, 10))
  }, [])

  const handleSliderRelease = useCallback(() => {
    // Persist to API only when user finishes adjusting
    updateRowHeightWithPersistence(localRowHeight)
  }, [localRowHeight, updateRowHeightWithPersistence])

  return (
    <Container>
      <Label htmlFor="row-height-slider">Row height</Label>
      <SliderContainer>
        <Slider
          id="row-height-slider"
          type="range"
          min={24}
          max={200}
          step={2}
          value={localRowHeight}
          onChange={handleSliderChange}
          onMouseUp={handleSliderRelease}
        />
        <ValueDisplay>{localRowHeight}</ValueDisplay>
      </SliderContainer>
    </Container>
  )
}

export default RowHeightSettings
