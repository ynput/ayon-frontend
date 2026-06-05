import { useRef } from 'react'
import { format, differenceInDays, isValid, parseISO } from 'date-fns'
import styled from 'styled-components'
import ProgressBar from '@pages/ProjectDashboard/panels/ProgressBar'
import { formatUTCDate } from '@shared/util/formatUTCDate'
import { Button, theme } from '@ynput/ayon-react-components'

const StyledContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0;
  width: 100%;
`

const TailButtonStyled = styled(Button)`
  ${theme.labelMedium};
  background-color: var(--md-sys-color-surface-container-high);
  width: 90px;
  height: 28px;
  z-index: 50;
  color: var(--md-sys-color-on-surface-variant);

  &:hover {
    background-color: var(--md-sys-color-surface-container-highest);
  }
`

const HiddenDateInput = styled.input`
  position: absolute;
  opacity: 0;
  pointer-events: none;
  width: 0;
  height: 0;
`

const ProgressStyled = styled.div`
  position: relative;
  display: flex;
  flex: 1;
  align-items: center;
`

const MarkerStyled = styled.div<{ $left: number }>`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;

  background-color: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);

  padding: 4px 8px;

  font-size: ${theme.labelSmall};
  border-radius: var(--border-radius-m);
  user-select: none;
  white-space: nowrap;
  z-index: 30;
`

interface DateTailButtonProps {
  value?: string
  placeholder: string
  onChange?: (value: string) => void | Promise<void>
  min?: string
  max?: string
}

const toInputDateValue = (value?: string) => {
  if (!value) return ''

  const parsedValue = parseISO(value)
  if (!isValid(parsedValue)) return ''

  return formatUTCDate(parsedValue, 'yyyy-MM-dd')
}

const toDisplayDate = (value?: string) => {
  if (!value) return undefined

  const parsedValue = parseISO(value)
  if (!isValid(parsedValue)) return undefined

  return format(parsedValue, 'd MMM yyyy')
}

const openDatePicker = (input: HTMLInputElement | null) => {
  if (!input) return

  input.focus()

  try {
    input.showPicker()
  } catch {
    input.click()
  }
}

const DateTailButton = ({ value, placeholder, onChange, min, max }: DateTailButtonProps) => {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDateChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value
    if (!nextValue) return

    const [year, month, day] = nextValue.split('-').map(Number)
    if (!year || !month || !day) return

    const nextDate = new Date(Date.UTC(year, month - 1, day))
    await onChange?.(nextDate.toISOString())
  }

  return (
    <TailButtonStyled type="button" onClick={() => openDatePicker(inputRef.current)}>
      {toDisplayDate(value) || placeholder}
      <HiddenDateInput
        ref={inputRef}
        type="date"
        value={toInputDateValue(value)}
        min={toInputDateValue(min)}
        max={toInputDateValue(max)}
        onChange={handleDateChange}
        onClick={(event) => event.stopPropagation()}
      />
    </TailButtonStyled>
  )
}

interface ProjectTimelineProps {
  startDate?: string
  endDate?: string
  isLoading?: boolean
  onStartDateChange?: (value: string) => void | Promise<void>
  onEndDateChange?: (value: string) => void | Promise<void>
}

const ProjectTimeline = ({
  startDate,
  endDate,
  isLoading,
  onStartDateChange,
  onEndDateChange,
}: ProjectTimelineProps) => {
  const parsedStart = startDate ? parseISO(startDate) : undefined
  const parsedEnd = endDate ? parseISO(endDate) : undefined
  const hasValidStart = !!parsedStart && isValid(parsedStart)
  const hasValidEnd = !!parsedEnd && isValid(parsedEnd)
  const length =
    hasValidStart && hasValidEnd ? Math.max(0, differenceInDays(parsedEnd, parsedStart)) : 0
  const hasCompleteRange = hasValidStart && hasValidEnd && length > 0

  let done = 0
  let left = 100
  let percentage = 0

  if (hasCompleteRange && parsedStart) {
    done = Math.max(0, Math.min(differenceInDays(new Date(), parsedStart), length))
    left = Math.max(0, length - done)
    percentage = Math.round((done / length) * 100)
  }

  if (isLoading) {
    return (
      <StyledContainer>
        <TailButtonStyled
          as="div"
          style={{ background: 'var(--md-sys-color-surface-container-low)', width: 90 }}
        />
        <ProgressStyled
          style={{
            flex: 1,
            height: 4,
            background: 'var(--md-sys-color-surface-container-low)',
            borderRadius: 2,
          }}
        />
        <TailButtonStyled
          as="div"
          style={{ background: 'var(--md-sys-color-surface-container-low)', width: 90 }}
        />
      </StyledContainer>
    )
  }

  return (
    <StyledContainer>
      <DateTailButton
        value={startDate}
        placeholder="Set start date"
        onChange={onStartDateChange}
        max={endDate}
      />
      <ProgressStyled>
        <ProgressBar
          isLoading={false}
          values={
            hasCompleteRange
              ? [
                  { value: done, label: `${done}/${length}` },
                  {
                    value: left,
                    label: `${length - done} Left`,
                    color: 'var(--md-sys-color-surface-container-highest)',
                  },
                ].filter((v) => v.value > 0)
              : [
                  {
                    value: 100,
                    label: null,
                    color: 'var(--md-sys-color-surface-container-highest)',
                  },
                ]
          }
          backgroundColor="var(--md-sys-color-surface-container-highest)"
        />
        {hasCompleteRange && done > 0 && done < length && (
          <MarkerStyled
            data-role="timeline-marker"
            $left={percentage}
            style={{
              left: `${percentage}%`,
              translate: `-${percentage}%`,
            }}
          >{`Day ${done}`}</MarkerStyled>
        )}
      </ProgressStyled>
      <DateTailButton
        value={endDate}
        placeholder="Set end date"
        onChange={onEndDateChange}
        min={startDate}
      />
    </StyledContainer>
  )
}

export default ProjectTimeline
