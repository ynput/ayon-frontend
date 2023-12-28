import React from 'react'
import * as Styled from './RestartBanner.styled'
import { Button } from '@ynput/ayon-react-components'
import Type from '/src/theme/typography.module.css'

const RestartBanner = ({ message = 'Restart server to apply changes.', onRestart }) => {
  return (
    <Styled.Banner>
      <span className={Type.titleMedium}>{message}</span>
      <Button variant="filled" onClick={onRestart}>
        Restart
      </Button>
    </Styled.Banner>
  )
}

export default RestartBanner
