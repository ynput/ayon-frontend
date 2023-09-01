import React from 'react'
import * as Styled from './Actions.styled'

const Actions = ({ options = [], pinned = [] }) => {
  // options =[{id: 'nuke', icon: 'nuke.png'}]
  // pinned = ['nuke']

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
      <Styled.More options={options} placeholder="" value={[]} />
    </Styled.Actions>
  )
}

export default Actions
