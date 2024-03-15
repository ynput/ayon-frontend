import { Button } from '@ynput/ayon-react-components'
import React from 'react'
import * as Styled from './ProjectButton.styled'

const ProjectButton = ({ label, code, onPin, onEdit, className, highlighted, ...props }) => {
  return (
    <Styled.Project
      {...props}
      tabIndex={0}
      className={`${className} ${highlighted ? 'highlighted' : ''}`}
    >
      <span style={{ marginRight: 8 }}>{label}</span>
      {/* code hides on hover */}
      {code && (
        <span className="code" tabIndex={-1}>
          {code}
        </span>
      )}
      {/* hover buttons */}
      {onEdit && <Button onClick={onEdit} icon="settings_applications" tabIndex={-1} />}
      <Button onClick={onPin} icon={'push_pin'} className="pin" tabIndex={-1} />
    </Styled.Project>
  )
}

export default ProjectButton
