import React from 'react'
import * as Styled from './RestartBanner.styled'
import { Button } from '@ynput/ayon-react-components'
import Type from '@/theme/typography.module.css'

const RestartBanner = ({ message = 'Restart server to apply changes.', onRestart, onSnooze }) => {
  return (
    <Styled.Banner>
      <Styled.Main>
        <span className={Type.titleMedium}>{message}</span>
        <Button variant="filled" onClick={onRestart}>
          Restart
        </Button>
      </Styled.Main>
      <Styled.SnoozeButton
        variant="text"
        icon={'snooze'}
        label="Snooze"
        data-tooltip="Snoozes banner until 8pm tonight"
        data-tooltip-delay={300}
        onClick={onSnooze}
      />
    </Styled.Banner>
  )
}

export default RestartBanner
