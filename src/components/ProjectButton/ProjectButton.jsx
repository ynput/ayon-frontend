import { Button } from '@ynput/ayon-react-components'
import React from 'react'
import * as Styled from './ProjectButton.styled'

const ProjectButton = ({ label, onPin, onEdit, ...props }) => {
  return (
    <Styled.Project {...props} tabIndex={0}>
      <span>{label}</span>
      {onEdit && <Button onClick={onEdit} icon="settings_applications" />}
      <Button onClick={onPin} icon={'push_pin'} className="pin" />
    </Styled.Project>
  )
}

export default ProjectButton
