import React from 'react'
import PropTypes from 'prop-types'
import styled, { css, keyframes } from 'styled-components'
import { useState } from 'react'

const ProgressStyled = styled.div`
  position: relative;
  display: flex;
  flex: 1;
  align-items: center;
  width: 100%;
  border-radius: 2px;
  background-color: black;
  overflow: hidden;

  /* block all animations once played once */
  ${({ animation }) =>
    !animation &&
    css`
      & > * {
        animation: none !important;
      }
    `}
`

const LinesAnimation = (left) => keyframes`
    from {
        left: ${-left}%;
        transform: scaleX(0);
    } to {
        transform: scaleX(1);
        left: 0;
    }
`

const LineStyled = styled.hr`
  /* default border color */
  border: 2px solid var(--color-hl-00);
  /* custom line color */
  border-color: ${({ color }) => color};
  flex: 1;
  margin: 0;
  transition: flex 1s;
  position: relative;

  flex: ${({ flex }) => flex};

  transform-origin: left;
  animation: ${({ left }) => LinesAnimation(left)} 1s forwards;
`

const ProgressBar = ({ values = [], backgroundColor, isLoading }) => {
  // block all animations once played once
  const [animation, setAnimation] = useState(true)
  // add placeholder line if only one value is provided
  if (values.length === 1) {
    values.push({
      value: 100 - values[0].value,
      color: 'transparent',
      label: 'none',
    })
  } else {
    // normalize values between 0 and 100
    const total = values.reduce((acc, { value }) => acc + value, 0)
    values = values.map(({ value, ...rest }) => ({
      value: Math.round((value / total) * 100),
      ...rest,
    }))
  }

  return (
    <ProgressStyled
      style={{ backgroundColor }}
      animation={animation}
      onAnimationEnd={() => setAnimation(false)}
    >
      {!isLoading &&
        values.map(({ value, color, label }, i, arr) => (
          <LineStyled
            color={color}
            flex={value}
            index={i}
            key={label + i}
            left={arr.slice(0, i).reduce((acc, { value }) => acc + value, 0)}
          />
        ))}
    </ProgressStyled>
  )
}

ProgressBar.propTypes = {
  backgroundColor: PropTypes.string,
  isLoading: PropTypes.bool,
  values: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.shape({
        value: PropTypes.number.isRequired,
        color: PropTypes.string,
        label: PropTypes.string.isRequired,
      }),
    ),
  ]),
}

export default ProgressBar
