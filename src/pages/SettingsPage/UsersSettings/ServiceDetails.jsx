import React from 'react'
import PropTypes from 'prop-types'
import { Panel } from 'ayon-react-components-test'
import LockedInputRow from '/src/components/LockedInput'
import ApiKeyManager from '/src/components/ApiKeyManager'

const ServiceDetails = ({ user, editName }) => {
  return (
    <Panel>
      <LockedInputRow value={user.name} label={'Username'} onEdit={editName} />
      <ApiKeyManager preview={user.apiKeyPreview} name={user.name} />
    </Panel>
  )
}

ServiceDetails.propTypes = {
  user: PropTypes.object,
  editPassword: PropTypes.func,
}

export default ServiceDetails
