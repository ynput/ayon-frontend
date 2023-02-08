import React from 'react'
import { format, differenceInDays } from 'date-fns'

import DashboardPanelWrapper from './DashboardPanelWrapper'
import { useGetProjectAttribsQuery } from '/src/services/getProject'
import { convertDate } from '/src/utils'
import styled, { css, keyframes } from 'styled-components'
import { useState } from 'react'
import { useEffect } from 'react'
import ProgressBar from './ProgressBar'

const TailsStyled = styled.div`
  border-radius: var(--panel-border-radius);
  background-color: var(--color-hl-00);
  white-space: nowrap;
  min-width: 126px;
  min-height: 38px;
  z-index: 20;

  &:hover {
    background-color: var(--color-hl-02);
  }

  color: black;
  font-weight: bold;
  font-size: 16px;

  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  height: fit-content;

  cursor: pointer;
  user-select: none;

  ${({ end }) =>
    end &&
    css`
      background-color: var(--color-grey-08);
      z-index: 10;

      :hover {
        background-color: var(--color-grey-09);
      }
    `}
`

const ProgressStyled = styled.div`
  position: relative;
  display: flex;
  flex: 1;
  align-items: center;

  /* block all animations once played once */
  ${({ animation }) =>
    !animation &&
    css`
      & > * {
        animation: none !important;
      }
    `}

  :hover {
    div:last-child {
      scale: 0;
    }
  }

  /* overide some line styles */

  div:first-child {
    border-radius: 0 !important;
  }

  hr {
    border-radius: 0 !important;

    :hover {
      scale: 1 !important;

      ::after {
        transform: translateX(-50%) scale(1.1) !important;
      }
    }

    /* custom label */
    ::after {
      left: 50% !important;
      transform: translateX(-50%) scale(0.5) !important;
      transform-origin: center !important;
      color: black;
      font-weight: bold;
    }
  }
`
const MarkerAnimation = (left) => keyframes`
    from {
        left: 0%;
        translate: -110%;
    }
    to {
        left: ${left}%;
        translate: ${-left}%;
    }

`

const MarkerStyled = styled(TailsStyled)`
  font-size: 12px;
  min-height: 24px;
  min-width: unset;
  padding: 4px;
  transition: left 1s, translate 1s, scale 0.3s;
  position: absolute;
  left: ${({ left }) => left}%;
  translate: ${({ left }) => -left}%;
  z-index: 30;

  animation: ${({ left }) => MarkerAnimation(left)} 1s forwards;
`

const Timeline = ({ projectName }) => {
  // animation played
  const [animation, setAnimation] = useState(true)
  const [isLoading, setLoading] = useState(true)
  const [data, setData] = useState({})

  let {
    // data = {},
    isError,
    // isLoading,
  } = useGetProjectAttribsQuery({
    projectName,
    attribs: ['start', 'end'],
  })
  let { start, end } = data.attrib || {}

  // fake API call
  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(false)
      const start = 1667660629,
        end = 1676905429
      setData({ attrib: { start, end } })
    }, 200)

    //   clear
    return () => {
      clearTimeout(timeout)
    }
  })

  let done = 0,
    left = 0,
    length = 0,
    percentage = 0,
    startString = '',
    endString = ''

  if (!isLoading) {
    //   convert to dates
    start = convertDate(start)
    end = convertDate(end)
    startString = format(start, 'd MMM yyyy')
    endString = format(end, 'd MMM yyyy')
    length = differenceInDays(end, start)
    done = differenceInDays(new Date(), start)
    left = length - done
    percentage = Math.round((done / length) * 100)
  }

  return (
    <DashboardPanelWrapper
      isError={isError}
      span={2}
      style={{
        flexDirection: 'row',
        gap: 0,
        alignItems: 'center',
        padding: '0 8px',
        flex: 1,
      }}
    >
      <TailsStyled>{startString}</TailsStyled>
      <ProgressStyled animation={animation} onAnimationEnd={() => setAnimation(false)}>
        <ProgressBar
          isLoading={isLoading}
          values={[
            { value: done, label: `${done}/${length}` },
            { value: left, label: `${length - done} Left`, color: 'var(--color-grey-08)' },
          ]}
          backgroundColor="var(--color-grey-08)"
        />
        <MarkerStyled left={percentage}>{!isLoading && `Day ${done}`}</MarkerStyled>
      </ProgressStyled>
      <TailsStyled end="true">{endString}</TailsStyled>
    </DashboardPanelWrapper>
  )
}

export default Timeline
