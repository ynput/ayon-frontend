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
  const { rowHeight: contextRowHeight = 40, updateRowHeight } = useColumnSettingsContext()

  // Local state for immediate UI updates (smooth slider)
  const [localRowHeight, setLocalRowHeight] = useState(contextRowHeight)

  // Debounced value for context updates (reduce expensive re-renders)
  const debouncedRowHeight = useDebounce(localRowHeight, 70) // 150ms delay

  // Update context when debounced value changes
  useEffect(() => {
    if (debouncedRowHeight !== contextRowHeight) {
      updateRowHeight(debouncedRowHeight)
    }
  }, [debouncedRowHeight, contextRowHeight, updateRowHeight])

  // Sync local state when context changes externally
  useEffect(() => {
    setLocalRowHeight(contextRowHeight)
  }, [contextRowHeight])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10)
    setLocalRowHeight(newValue) // Immediate UI update
  }, [])

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
          value={localRowHeight} // Use local state for smooth slider
          onChange={handleChange}
        />
        <ValueDisplay>{localRowHeight}</ValueDisplay>
      </SliderContainer>
    </Container>
  )
}

export default RowHeightSettings
