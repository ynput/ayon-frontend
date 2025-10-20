import { FC, useState, useCallback, useEffect } from 'react'
import styled from 'styled-components'
import { useDebounce } from 'primereact/hooks'

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
  background: var(--md-sys-color-outline-variant);
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
    cursor: grab;
    box-shadow: var(--box-fill);
  }

  &:active::-webkit-slider-thumb {
    cursor: grabbing;
  }

  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--md-sys-color-primary);
    cursor: grabbing;
    border: 2px solid var(--md-sys-color-surface);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  &:hover::-webkit-slider-thumb {
    background: var(--md-sys-color-primary-hover);
  }

  &:hover::-moz-range-thumb {
    background: var(--md-sys-color-primary-container);
  }
`

const ValueDisplay = styled.span`
  color: var(--md-sys-color-on-surface-variant);
  min-width: 40px;
  text-align: right;
`

export interface HeightSliderProps {
  value: number
  onChange: (value: number) => void
  onChangeComplete?: (value: number) => void
  title: string
  id?: string
  min?: number
  max?: number
  step?: number
  debounceMs?: number
}

export const SizeSlider: FC<HeightSliderProps> = ({
  value: externalValue,
  onChange,
  onChangeComplete,
  title,
  id = 'height-slider',
  min = 24,
  max = 200,
  step = 2,
  debounceMs = 25,
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [localValue, setLocalValue] = useState(externalValue)
  const [isUserAdjusting, setIsUserAdjusting] = useState(false)

  // Sync local value when external value changes and we're not dragging or adjusting
  useEffect(() => {
    if (!isDragging && !isUserAdjusting) {
      setLocalValue(externalValue)
    }
  }, [externalValue, isDragging, isUserAdjusting])

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10)

    // Mark that user is actively adjusting
    setIsUserAdjusting(true)
    // Update local state immediately for responsive slider
    setLocalValue(newValue)
  }, [])

  // Debounce the local value to avoid too many updates
  const debouncedValue = useDebounce(localValue, debounceMs)

  // Update via onChange when debounced value changes, but only if user is adjusting
  useEffect(() => {
    if (isUserAdjusting) {
      onChange(localValue)
    }
  }, [debouncedValue, onChange, isUserAdjusting, localValue])

  const handleSliderStart = useCallback(() => {
    setIsDragging(true)
  }, [])

  const handleSliderRelease = useCallback(() => {
    setIsDragging(false)
    setIsUserAdjusting(false)
    // Call onChangeComplete when user finishes adjusting (if provided)
    if (onChangeComplete) {
      onChangeComplete(localValue)
    }
  }, [localValue, onChangeComplete])

  // Calculate the percentage for the gradient fill
  const fillPercentage = ((localValue - min) / (max - min)) * 100

  return (
    <Container>
      <Label htmlFor={id}>{title}</Label>
      <SliderContainer>
        <Slider
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={localValue}
          onChange={handleSliderChange}
          onMouseDown={handleSliderStart}
          onMouseUp={handleSliderRelease}
          style={{
            background: `linear-gradient(to right, var(--md-sys-color-primary) 0%, var(--md-sys-color-primary) ${fillPercentage}%, var(--md-sys-color-outline-variant) ${fillPercentage}%, var(--md-sys-color-outline-variant) 100%)`,
          }}
        />
        <ValueDisplay>{localValue}</ValueDisplay>
      </SliderContainer>
    </Container>
  )
}
