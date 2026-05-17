import { useState } from 'react'
import { format, differenceInDays } from 'date-fns'
import styled, { css, keyframes } from 'styled-components'
import ProgressBar from '@pages/ProjectDashboard/panels/ProgressBar'

const StyledContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0;
  width: 100%;
`

const TailStyled = styled.div<{ $end?: boolean }>`
  border-radius: var(--border-radius);
  background-color: var(--md-sys-color-surface-container-high);
  white-space: nowrap;
  min-width: 80px;
  height: 28px;
  z-index: 50;
  color: var(--md-sys-color-on-surface-variant);
  font-weight: 600;
  font-size: 11px;
  padding: 0 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;

  ${({ $end }) =>
    $end &&
    css`
      background-color: var(--md-sys-color-surface-container);
      color: var(--md-sys-color-on-surface-variant);
      z-index: 10;
    `}
`

const ProgressStyled = styled.div<{ $animation: boolean }>`
  position: relative;
  display: flex;
  flex: 1;
  align-items: center;

  ${({ $animation }) =>
    !$animation &&
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

    ::after {
      left: 50% !important;
      transform: translateX(-50%) scale(0.5) !important;
      transform-origin: center !important;
      color: var(--md-sys-color-on-secondary);
      font-weight: bold;
      font-size: 10px;
      bottom: 4px;
    }
  }
`

const MarkerAnimation = (left: number) => keyframes`
  from {
    left: 0%;
    translate: -110%;
  }
  to {
    left: ${left}%;
    translate: ${-left}%;
  }
`

const MarkerStyled = styled(TailStyled)<{ $left: number }>`
  font-size: 10px;
  height: 20px;
  min-width: unset;
  padding: 0 4px;
  transition: left 1s, translate 1s, scale 0.3s;
  position: absolute;
  left: ${({ $left }) => $left}%;
  translate: ${({ $left }) => -$left}%;
  z-index: 30;
  background-color: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);

  animation: ${({ $left }) => MarkerAnimation($left)} 1s forwards;
`

interface ProjectTimelineProps {
  startDate?: string
  endDate?: string
  isLoading?: boolean
}

const ProjectTimeline = ({ startDate, endDate, isLoading }: ProjectTimelineProps) => {
  const [animation, setAnimation] = useState(true)

  let done = 0,
    left = 0,
    length = 0,
    percentage = 0,
    startString = '',
    endString = ''

  if (startDate || endDate) {
    let start = new Date(startDate || '')
    let end = new Date(endDate || '')

    if (isNaN(start.getTime())) {
      start = new Date()
    }

    if (isNaN(end.getTime())) {
      end = new Date(start.getTime() + 10 * 24 * 60 * 60 * 1000)
    }

    startString = format(start, 'd MMM yyyy')
    endString = format(end, 'd MMM yyyy')
    length = differenceInDays(end, start)
    done = Math.max(0, Math.min(differenceInDays(new Date(), start), length))
    left = length - done
    percentage = Math.round((done / length) * 100)
  } else {
    startString = 'No start date'
    endString = 'No end date'
  }

  if (isLoading) {
    return (
      <StyledContainer>
        <TailStyled
          style={{ background: 'var(--md-sys-color-surface-container-low)', width: 90 }}
        />
        <ProgressStyled
          $animation={false}
          style={{
            flex: 1,
            height: 4,
            background: 'var(--md-sys-color-surface-container-low)',
            borderRadius: 2,
          }}
        />
        <TailStyled
          $end
          style={{ background: 'var(--md-sys-color-surface-container-low)', width: 90 }}
        />
      </StyledContainer>
    )
  }

  return (
    <StyledContainer>
      <TailStyled data-tooltip="Start date">{startString}</TailStyled>
      <ProgressStyled $animation={animation} onAnimationEnd={() => setAnimation(false)}>
        <ProgressBar
          isLoading={false}
          values={[
            { value: done, label: `${done}/${length}` },
            {
              value: left,
              label: `${length - done} Left`,
              color: 'var(--md-sys-color-surface-container-highest)',
            },
          ]}
          backgroundColor="var(--md-sys-color-surface-container-highest)"
        />
        <MarkerStyled $left={percentage}>{`Day ${done}`}</MarkerStyled>
      </ProgressStyled>
      <TailStyled $end data-tooltip="End date">
        {endString}
      </TailStyled>
    </StyledContainer>
  )
}

export default ProjectTimeline
