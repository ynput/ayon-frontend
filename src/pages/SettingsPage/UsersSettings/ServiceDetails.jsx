import React from 'react'
import PropTypes from 'prop-types'
import { LockedInput, Panel } from '@ynput/ayon-react-components'
import ApiKeyManager from '@components/ApiKeyManager'

const ServiceDetails = ({ user, editName }) => {
  return (
    <Panel>
      <LockedInput value={user.name} label={'Username'} onEdit={editName} />
      <ApiKeyManager preview={user.apiKeyPreview} name={user.name} />
    </Panel>
  )
}

ServiceDetails.propTypes = {
  user: PropTypes.object,
  editPassword: PropTypes.func,
}

export default ServiceDetails
