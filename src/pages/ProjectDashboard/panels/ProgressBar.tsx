import React, { FC, useState } from 'react'
import styled, { css, keyframes } from 'styled-components'

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
  background-color: black;
`

const LinesAnimation = (left: number) => keyframes`
    from {
        left: ${-left}%;
        transform: scaleX(0);
    } to {
        transform: scaleX(1);
        left: 0;
    }
`

interface LineStyledProps {
  color?: string
  flex: number
  label: string | null
  index: number
  length: number
  animation: boolean
  left: number
}

const LineStyled = styled.hr<LineStyledProps>`
  /* default border color */
  border: 2.5px solid var(--md-sys-color-primary);
  /* custom line color */
  border-color: ${({ color }) => color};
  flex: 1;
  margin: 0;
  transition: flex 1s, scale 0.3s;
  position: relative;
  overflow: visible;
  cursor: pointer;

  flex: ${({ flex }) => flex};

  transform-origin: left;
  animation: ${({ left }) => LinesAnimation(left)} 1s forwards;
  /* block all animations once played once */
  ${({ animation }) =>
    !animation &&
    css`
      animation: none !important;
    `}

  &::before {
    /* expand the hover zone but keep hidden */
    background-color: transparent;
    bottom: -10px;
    width: 100%;
    content: '';
    height: 20px;
    position: absolute;
    opacity: 0;
  }

  /* HOVER LABEL */
  &::after {
    opacity: 0;
    /* default hide */
    transform-origin: center;
    transition: transform 0.3s;
    content: ${({ label }) => `'${label}'`};
    position: absolute;
    bottom: 8px;
    z-index: 20;

    color: var(--md-sys-color-on-primary);
    background-color: var(--primary-color);
    background-color: ${({ color }) => color};
    padding: 0 4px;
    border-radius: 3px;
    white-space: nowrap;

    /* center label */
    left: 50%;
    transform: translateX(-50%) scale(0.5);
  }

  /* border radius on start and end */
  ${({ index }) =>
    index === 0 &&
    css`
      border-top-left-radius: 2px;
      border-bottom-left-radius: 2px;
    `}
  ${({ index, length }) =>
    index === length - 1 &&
    css`
      border-top-right-radius: 2px;
      border-bottom-right-radius: 2px;
    `}


  /* HOVER */
  ${({ label }) =>
    label &&
    css`
      &:hover {
        scale: 1.2;
        transform-origin: center;
        z-index: 20;

        &::after {
          /* reveal on hover */
          transform: translateX(-50%) scale(1);
          opacity: 1;
        }
      }
      /* flex below 25 and index either start or end */

      ${({ index, length, animation }) =>
        (index === 0 || index === length - 1) &&
        !animation &&
        css`
          transform-origin: ${index === 0 ? 'left' : 'right'} !important;
          &:hover {
            ::after {
              left: ${index === 0 ? '0' : '100%'};
              transform: translateX(${index === 0 ? '0' : '-100%'}) scale(1);
              transform-origin: ${index === 0 ? 'right' : 'left'};
            }
          }
        `}
    `}
`

const ProgressBar: FC<ProgressBarProps> = ({ values = [], backgroundColor, onClick }) => {
  // block all animations once played once
  const [animation, setAnimation] = useState(true)

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
    <ProgressStyled style={{ backgroundColor }} onAnimationEnd={() => setAnimation(false)}>
      {normalizedValues.map(({ value, color, label }, i, arr) => (
        <LineStyled
          animation={animation}
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
