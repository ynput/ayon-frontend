import { FC } from 'react'
import styled from 'styled-components'

interface Value {
  value: number
  color?: string
  label: string | null
}

interface ProgressBarProps {
  values?: Value[]
  backgroundColor?: string
  isLoading?: boolean
  onClick?: (item: { value: number; label: string | null }) => void
}

const ProgressStyled = styled.div`
  position: relative;
  display: flex;
  flex: 1;
  min-height: 4px;
  align-items: center;
  width: 100%;
  border-radius: 2px;
`

interface LineStyledProps {
  color?: string
  flex: number
  label: string | null
  index: number
  length: number
  left: number
}

const LineStyled = styled.hr<LineStyledProps>`
  /* default border color */
  border: 2.5px solid var(--md-sys-color-primary);
  /* custom line color */
  border-color: ${({ color }) => color};
  flex: 1;
  margin: 0;
  position: relative;
  overflow: visible;

  flex: ${({ flex }) => flex};

  transform-origin: left;
`

const ProgressBar: FC<ProgressBarProps> = ({ values = [], backgroundColor, onClick }) => {
  let normalizedValues = [...values]

  // add placeholder line if only one value is provided
  if (normalizedValues.length === 1) {
    normalizedValues.push({
      value: 100 - normalizedValues[0].value,
      color: 'transparent',
      label: null,
    })
  } else if (normalizedValues.length > 0) {
    // normalize values between 0 and 100
    const total = normalizedValues.reduce((acc, { value }) => acc + value, 0)
    normalizedValues = normalizedValues.map(({ value, ...rest }) => ({
      value: Math.round((value / total) * 100),
      ...rest,
    }))
  }

  return (
    <ProgressStyled style={{ backgroundColor }}>
      {normalizedValues.map(({ value, color, label }, i, arr) => (
        <LineStyled
          color={color}
          flex={value}
          label={label}
          index={i}
          length={arr.length}
          key={i}
          left={arr.slice(0, i).reduce((acc, { value }) => acc + value, 0)}
          onClick={() => onClick && onClick({ value, label })}
        />
      ))}
    </ProgressStyled>
  )
}

export default ProgressBar
