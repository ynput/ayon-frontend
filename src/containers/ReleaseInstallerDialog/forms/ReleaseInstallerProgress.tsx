import { FC, useEffect, useState } from 'react'
import { EventWithProgress } from '../hooks/useInstallRelease'
import styled from 'styled-components'
import { Button, Toolbar } from '@ynput/ayon-react-components'

const StyledProgress = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
`

const ProgressBar = styled.div<{ $progress: number }>`
  width: 100%;
  height: 12px;
  background-color: var(--md-sys-color-surface-container);
  border-radius: 6px;
  overflow: hidden;

  &::before {
    content: '';
    display: block;
    width: ${({ $progress }) => $progress * 100}%;
    height: 100%;
    background-color: ${({ $progress }) =>
      $progress === 1 ? 'var(--md-sys-color-tertiary)' : 'var(--md-sys-color-primary)'};
    border-radius: 6px;
    transition: width 0.3s;
  }
`

interface ReleaseInstallerProgressProps {
  progress: EventWithProgress[]
  onInstallFinished: () => void
  onFinishAction: (restart: boolean) => void
}

export const ReleaseInstallerProgress: FC<ReleaseInstallerProgressProps> = ({
  progress,
  onInstallFinished,
  onFinishAction,
}) => {
  const [hasFinished, setHasFinished] = useState(false)
  // get currently installing event
  const currentInstalling = progress.find((event) => event.status === 'in_progress')
  const isFinished = progress.every((event) => event.status === 'finished')

  // total size of all events
  const totalSize = progress.reduce((acc, event) => {
    return acc + event.size
  }, 0)

  // callback when all events are finished
  useEffect(() => {
    if (isFinished && !hasFinished) {
      onInstallFinished()
      // prevent calling onFinishAction multiple times
      setHasFinished(true)
    }
  }, [isFinished, hasFinished, onInstallFinished])

  return (
    <StyledProgress>
      <ProgressBar $progress={calculateTotalProgress(progress, totalSize)} />
      {isFinished
        ? 'Installed successfully. Restart server to apply changes.'
        : getInstallMessage(currentInstalling)}
      {isFinished && (
        <Toolbar>
          <Button icon="snooze" onClick={() => onFinishAction(false)}>
            Restart later (snooze)
          </Button>
          <Button variant="filled" disabled={!isFinished} onClick={() => onFinishAction(true)}>
            Restart now
          </Button>
        </Toolbar>
      )}
    </StyledProgress>
  )
}

const getInstallMessage = (event?: EventWithProgress): string => {
  if (!event) return 'Installing release...'
  return 'Installing: ' + event.label + '...'
}

// take all the events and calculate the total progress based on progress field
const calculateTotalProgress = (progress: EventWithProgress[], total: number): number => {
  // total progress of all events
  const progressTotal = progress.reduce((acc, event) => {
    if (event.status === 'finished') return acc + event.size
    return acc + ((event.progress || 0) / 100) * event.size
  }, 0)

  return Math.round((progressTotal / total) * 100) / 100
}
