import React from 'react'
import * as Styled from './Actions.styled'
import { Button } from '@ynput/ayon-react-components'

const Actions = ({ options = [], pinned = [] }) => {
  // options =[{id: 'nuke', icon: 'nuke.png'}]
  // pinned = ['nuke']

  const showPlaceholder = true
  // return empty placeholder until finished
  if (showPlaceholder)
    return <Button icon="manufacturing" disabled data-tooltip="Actions coming soon" />

  return (
    <Styled.Actions>
      {pinned.flatMap((id) => {
        const option = options.find((o) => o.id === id)
        if (!option) return []
        return (
          <Styled.PinnedAction key={id}>
            <img src={`/logos/${option.icon}`} />
          </Styled.PinnedAction>
        )
      })}
      <Styled.More options={options} placeholder="" value={[]} disabled />
    </Styled.Actions>
  )
}

export default Actions
