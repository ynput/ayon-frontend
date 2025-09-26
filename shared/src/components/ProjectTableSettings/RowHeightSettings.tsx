import { FC } from 'react'
import styled from 'styled-components'
import { useColumnSettingsContext } from '@shared/containers/ProjectTreeTable'

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
  const { rowHeight = 40, updateRowHeight } = useColumnSettingsContext()

  console.log('RowHeightSettings: current rowHeight from context is', rowHeight) // Debug log

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10)
    console.log('RowHeightSettings: slider onChange event with', newValue, 'current context rowHeight is', rowHeight) // Debug log
    updateRowHeight(newValue)
  }

  const handleMouseUp = (e: React.MouseEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.currentTarget.value, 10)
    console.log('RowHeightSettings: slider mouseup event with', newValue, 'current context rowHeight is', rowHeight) // Debug log
  }

  const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.currentTarget.value, 10)
    console.log('RowHeightSettings: slider input event with', newValue, 'current context rowHeight is', rowHeight) // Debug log
  }

  return (
    <Container>
      <Label htmlFor="row-height-slider">Row Height</Label>
      <SliderContainer>
        <Slider
          id="row-height-slider"
          type="range"
          min={30}
          max={200}
          step={5}
          value={rowHeight}
          onChange={handleChange}
          onMouseUp={handleMouseUp}
          onInput={handleInput}
        />
        <ValueDisplay>{rowHeight}px</ValueDisplay>
      </SliderContainer>
    </Container>
  )
}

export default RowHeightSettings
