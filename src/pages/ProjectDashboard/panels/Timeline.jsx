import React from 'react'
import { format, differenceInDays } from 'date-fns'

import DashboardPanelWrapper from './DashboardPanelWrapper'
import { useGetProjectQuery } from '@shared/api'
import styled, { css, keyframes } from 'styled-components'
import { useState } from 'react'
import ProgressBar from './ProgressBar'
import clsx from 'clsx'
import { useAppSelector } from '@state/store'

const TailsStyled = styled.div`
  border-radius: var(--panel-border-radius);
  background-color: var(--primary-color);
  white-space: nowrap;
  min-width: 126px;
  min-height: 38px;
  z-index: 50;

  color: var(--md-sys-color-on-primary);
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
      background-color: var(--md-sys-color-on-surface);
      color: var(--md-sys-color-on-secondary);
      z-index: 10;
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

  &:hover {
    div:last-child {
      scale: 0;
    }
  }

  div:first-child {
    border-radius: 0 !important;
  }

  hr {
    border-radius: 0 !important;

    &:hover {
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
      color: var(--md-sys-color-on-secondary);
      font-weight: bold;
      font-size: 11px;
      bottom: 5px;
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

  const { data: project, isFetching } = useGetProjectQuery({ projectName })
  const { startDate, endDate } = project?.attrib || {}

  let done = 0,
    left = 0,
    length = 0,
    percentage = 0,
    startString = '',
    endString = ''

  if (startDate || endDate) {
    let start = new Date(startDate || '')
    let end = new Date(endDate || '')

    // check dates are valid using date-fns
    if (isNaN(start)) {
      start = new Date()
    }

    if (isNaN(end)) {
      end = new Date(start.getTime() + 10 * 24 * 60 * 60 * 1000)
    }

    startString = format(start, 'd MMM yyyy')
    endString = format(end, 'd MMM yyyy')
    length = differenceInDays(end, start)
    done = Math.max(0, Math.min(differenceInDays(new Date(), start), length))
    left = length - done
    percentage = Math.round((done / length) * 100)
  } else {
    startString = 'No Start Date'
    endString = 'No End Date'
  }

  return (
    <DashboardPanelWrapper
      span={2}
      style={{
        flexDirection: 'row',
        gap: 0,
        alignItems: 'center',
        padding: '0 8px',
        flex: 1,
      }}
      stylePanel={{ height: '100%' }}
      className={clsx({ loading: isFetching }, 'shimmer-dark')}
    >
      <TailsStyled data-tooltip={'Start date'}>{startString}</TailsStyled>
      <ProgressStyled animation={animation} onAnimationEnd={() => setAnimation(false)}>
        <ProgressBar
          isLoading={isFetching}
          is
          values={[
            { value: done, label: `${done}/${length}` },
            {
              value: left,
              label: `${length - done} Left`,
              color: 'var(--md-sys-color-on-surface)',
            },
          ]}
          backgroundColor="var(--md-sys-color-on-surface)"
        />
        <MarkerStyled left={percentage}>{!isFetching && `Day ${done}`}</MarkerStyled>
      </ProgressStyled>
      <TailsStyled end="true" data-tooltip={'End date'}>
        {endString}
      </TailsStyled>
    </DashboardPanelWrapper>
  )
}

export default Timeline
